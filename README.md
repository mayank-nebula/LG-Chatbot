
import os
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging
import time
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API endpoint
url = "http://localhost:8181/infer-file"

# Folder containing images
image_folder = "/home/Mayank.Sharma/GV_Test/retriever/output"  # Replace with your image folder path

task_prompt = "<OCR>"  # Replace with your task prompt

# Maximum number of retries for failed requests
max_retries = 3

# Function to validate image file
def is_valid_image(file_path):
    try:
        with Image.open(file_path) as img:
            img.verify()
        return True
    except (IOError, SyntaxError) as e:
        logger.error(f"Invalid image file {file_path}: {e}")
        return False

# Function to send a request to the API
def send_infer_request(image_path):
    for attempt in range(max_retries):
        try:
            with open(image_path, 'rb') as file:
                files = {'files': file}
                data = {'task_prompt': task_prompt}
                logger.info(f"Sending request for {image_path}")
                response = requests.post(url, files=files, data=data)
                logger.info(f"Response status code: {response.status_code}")
                if response.status_code != 200:
                    logger.error(f"Response content: {response.content}")
                response.raise_for_status()  # Raise an exception for HTTP errors
                return response.json()
        except requests.RequestException as e:
            logger.error(f"Request failed for {image_path} on attempt {attempt + 1}/{max_retries}: {e}")
            time.sleep(2 ** attempt)  # Exponential backoff
    return {"error": f"Failed to process {image_path} after {max_retries} attempts"}

# Collect all valid image paths in the folder
image_paths = [os.path.join(image_folder, file) for file in os.listdir(image_folder) if file.endswith(('.png', '.jpg', '.jpeg')) and is_valid_image(os.path.join(image_folder, file))]

# Perform parallel inferencing
def parallel_inferencing(image_paths, max_workers=10):
    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_image = {executor.submit(send_infer_request, path): path for path in image_paths}
        for future in as_completed(future_to_image):
            image_path = future_to_image[future]
            try:
                result = future.result()
                results.append((image_path, result))
            except Exception as exc:
                logger.error(f'{image_path} generated an exception: {exc}')
    return results

if __name__ == "__main__":
    if not os.path.exists(image_folder):
        logger.error(f"Image folder {image_folder} does not exist")
    else:
        results = parallel_inferencing(image_paths)
        for image_path, result in results:
            logger.info(f"Image: {image_path} \nResult: {result}\n")








from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, HttpUrl, ValidationError
from transformers import AutoProcessor, AutoModelForCausalLM
from PIL import Image
import requests
import torch
import os
import asyncio
import logging
import uvicorn

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

class InputData(BaseModel):
    image_urls: Optional[List[HttpUrl]] = None
    file_paths: Optional[List[str]] = None
    task_prompt: str

model_name = "microsoft/Florence-2-large"
processor = None
model = None
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def load_model():
    global processor, model
    if processor is None or model is None:
        logger.info(f"Loading processor and model: {model_name}")
        processor = AutoProcessor.from_pretrained(model_name, trust_remote_code=True)
        model = AutoModelForCausalLM.from_pretrained(model_name, trust_remote_code=True)
        model.to(device)
        logger.info("Model and processor loaded successfully")
    else:
        logger.info("Model and processor already loaded")

@app.on_event("startup")
async def startup_event():
    load_model()

async def load_image(image_url: Optional[str] = None, file_path: Optional[str] = None) -> Image.Image:
    try:
        if image_url:
            response = requests.get(image_url, stream=True)
            response.raise_for_status()
            image = Image.open(response.raw)
        elif file_path:
            image = Image.open(file_path)
        return image
    except Exception as e:
        logger.error(f"Error loading image from {'url' if image_url else 'file'}: {e}")
        raise e

@app.post("/infer")
async def infer(data: InputData):
    try:
        load_model()
        if not data.image_urls and not data.file_paths:
            raise HTTPException(status_code=400, detail="Either image_urls or file_paths must be provided.")
        
        images = []
        if data.image_urls:
            images = await asyncio.gather(*[load_image(image_url=url) for url in data.image_urls])
        if data.file_paths:
            images += [await load_image(file_path=path) for path in data.file_paths]

        results = []
        for image in images:
            inputs = processor(text=data.task_prompt, images=image, return_tensors="pt").to(device)
            with torch.no_grad():
                generated_ids = model.generate(
                    input_ids=inputs["input_ids"],
                    pixel_values=inputs["pixel_values"],
                    max_new_tokens=1024,
                    num_beams=3,
                    do_sample=False
                )
            generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
            parsed_answer = processor.post_process_generation(generated_text, task=data.task_prompt, image_size=(image.width, image.height))
            results.append(parsed_answer)

        return {"results": results}
    except ValidationError as ve:
        logger.error(f"Validation error: {ve}")
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.error(f"Internal server error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

@app.post("/infer-file")
async def infer_file(task_prompt: str = Form(...), files: List[UploadFile] = File(...)):
    try:
        load_model()
        logger.info(f"Received task_prompt: {task_prompt}")
        logger.info(f"Received files: {[file.filename for file in files]}")
        
        if not task_prompt:
            raise HTTPException(status_code=400, detail="Task prompt must be provided.")

        images = []
        for file in files:
            try:
                image = Image.open(file.file)
                images.append(image)
            except Exception as e:
                logger.error(f"Error opening image file {file.filename}: {e}")
                raise HTTPException(status_code=422, detail=f"Error opening image file {file.filename}: {e}")

        results = []
        for image in images:
            inputs = processor(text=task_prompt, images=image, return_tensors="pt").to(device)
            with torch.no_grad():
                generated_ids = model.generate(
                    input_ids=inputs["input_ids"],
                    pixel_values=inputs["pixel_values"],
                    max_new_tokens=1024,
                    num_beams=3,
                    do_sample=False
                )
            generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
            parsed_answer = processor.post_process_generation(generated_text, task=task_prompt, image_size=(image.width, image.height))
            results.append(parsed_answer)

        return {"results": results}
    except ValidationError as ve:
        logger.error(f"Validation error: {ve}")
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.error(f"Internal server error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

# if __name__ == "__main__":
#     uvicorn.run("image2ocr:app", host="0.0.0.0", port=8181)

















import requests
from PIL import Image
import os
import json

# Function to send an image to the API for table detection
def send_image_for_detection(api_url, image_path, output_dir):
    with open(image_path, 'rb') as image_file:
        files = {'file': image_file}
        data = {'output_dir': output_dir}
        response = requests.post(api_url, files=files, data=data)
        response.raise_for_status()  # Raise an exception for HTTP errors
        return response.json()

# Function to save the results
def save_results(response, image_path, output_dir):
    # Load and save the image with bounding boxes
    image_with_boxes_path = 'image_with_boxes.png'
    if os.path.exists(image_with_boxes_path):
        image_with_boxes = Image.open(image_with_boxes_path)
        output_image_with_boxes_path = os.path.join(output_dir, os.path.basename(image_with_boxes_path))
        image_with_boxes.save(output_image_with_boxes_path)
        print(f"Image with bounding boxes saved to {output_image_with_boxes_path}")

    # Save the cropped table images
    for cropped_image_path in response['cropped_images']:
        full_cropped_image_path = os.path.join(output_dir, os.path.basename(cropped_image_path))
        cropped_image = Image.open(full_cropped_image_path)
        cropped_image.save(full_cropped_image_path)
        print(f"Cropped image saved to {full_cropped_image_path}")

# Main inferencing function
def main():
    api_url = "http://localhost:8183/detect-tables"
    image_path = "/home/mayank.sharma/GV/ingestion/output/slide_1.png"
    output_dir = "/home/mayank.sharma/GV/ingestion/testOutput/"

    try:
        # Send image for detection
        response = send_image_for_detection(api_url, image_path, output_dir)
        print(json.dumps(response, indent=4))

        # Save the results
        save_results(response, image_path, output_dir)
    except requests.RequestException as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()























from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from transformers import DetrImageProcessor, DetrForObjectDetection
import torch
from PIL import Image, ImageDraw, ImageFont
import os
import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

model_name = "TahaDouaji/detr-doc-table-detection"
processor = DetrImageProcessor.from_pretrained(model_name)
model = DetrForObjectDetection.from_pretrained(model_name)
model.eval()

def draw_boxes(image, boxes, labels, scores, id2label):
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()

    for box, label, score in zip(boxes, labels, scores):
        box = [round(i, 2) for i in box.tolist()]
        draw.rectangle(box, outline="red", width=3)
        draw.text((box[0], box[1]), f"{id2label[label.item()]}: {round(score.item(), 3)}", fill="red", font=font)

    return image

def crop_and_save(image, boxes, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    cropped_images = []
    for idx, box in enumerate(boxes):
        box = [round(i, 2) for i in box.tolist()]
        cropped_image = image.crop(box)
        cropped_image_path = os.path.join(output_dir, f"table_{idx+1}.png")
        cropped_image.save(cropped_image_path)
        cropped_images.append(cropped_image_path)
        logger.info(f"Cropped image saved to {cropped_image_path}")
    
    return cropped_images

@app.post("/detect-tables")
async def detect_tables(file: UploadFile = File(...), output_dir: str = Form(...)):
    try:
        image = Image.open(file.file).convert('RGB')

        image_array = np.array(image)

        inputs = processor(images=image_array, return_tensors="pt")
        outputs = model(**inputs)

        target_sizes = torch.tensor([image.size[::-1]])
        results = processor.post_process_object_detection(outputs, target_sizes=target_sizes, threshold=0.85)[0]

        for score, label, box in zip(results["scores"], results["labels"], results["boxes"]):
            box = [round(i, 2) for i in box.tolist()]
            logger.info(
                f"Detected {model.config.id2label[label.item()]} with confidence "
                f"{round(score.item(), 3)} at location {box}"
            )

        image_with_boxes = draw_boxes(image.copy(), results["boxes"], results["labels"], results["scores"], model.config.id2label)

        output_path = 'image_with_boxes.png'
        image_with_boxes.save(output_path)

        cropped_images = crop_and_save(image, results["boxes"], output_dir)

        return {"message": "Tables detected and processed successfully", "cropped_images": cropped_images}
    
    except Exception as e:
        logger.error(f"Internal server error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


















from pipeline_flask_frontend import app

if __name__ == "__main__":
    app.run()












import os
import subprocess

import psutil
from flask import Flask, render_template_string

app = Flask(__name__)
PIPELINE_LOG = "pipeline_question.log"
PIPELINE_SCRIPT = "pipeline.py"


@app.route("/flask_pipeline")
def index():
    status, pid = check_pipeline()
    logs = get_logs()
    return render_template_string(
        """
        <form action="/flask_pipeline/start" method="post">
            <button type="submit" {% if status == 'running' %} disabled {% endif %}>Start Pipeline</button>
        </form>
        <form action="/flask_pipeline/stop" method="post">
            <button type="submit" {% if status == 'stopped' %} disabled {% endif %}>Stop Pipeline</button>
        </form>
        <form action="/flask_pipeline/restart" method="post">
            <button type="submit">Restart Pipeline</button>
        </form>
        <h2>Status: {{ status }}</h2>
        <h2>Logs:</h2>
        <pre id="logs">{{ logs }}</pre>
        <script>
            setInterval(function() {
                fetch('/flask_pipeline/logs')
                    .then(response => response.text())
                    .then(data => {
                        document.getElementById('logs').innerText = data;
                    });
            }, 5000);
        </script>
    """,
        status=status,
        logs=logs,
    )


@app.route("/flask_pipeline/start", methods=["POST"])
def start_pipeline():
    status, pid = check_pipeline()
    if status == "stopped":
        try:
            with open(PIPELINE_LOG, "a") as f:
                command = f"python {PIPELINE_SCRIPT}"
                subprocess.Popen(command, shell=True, stdout=f, stderr=f)
            return "Pipeline Started"
        except Exception as e:
            with open(PIPELINE_LOG, "a") as f:
                f.write(f"Error starting pipeline: {e}\n")
            return "Error starting pipeline"
    return "Pipeline already running"


@app.route("/flask_pipeline/stop", methods=["POST"])
def stop_pipeline():
    status, pid = check_pipeline()
    if status == "running":
        os.kill(pid, 9)
    return "Pipeline stopped!"


@app.route("/flask_pipeline/restart", methods=["POST"])
def restart_pipeline():
    stop_pipeline()
    start_pipeline()
    return "Pipeline restarted!"


@app.route("/flask_pipeline/logs")
def get_logs():
    try:
        with open(PIPELINE_LOG, "r") as f:
            logs = f.read()
        return logs
    except FileNotFoundError:
        return "No logs available."


def check_pipeline():
    for proc in psutil.process_iter(["pid", "name", "cmdline"]):
        if proc.info["name"] == "python" and PIPELINE_SCRIPT in proc.info["cmdline"]:
            return "running", proc.info["pid"]
    return "stopped", None


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050)





















import logging

# from sharepoint_file_acquisition import sharepoint_file_acquisition
# from question_generation import generate_10_questions

logging.basicConfig(
    filename="pipeline.log", level=logging.INFO, format="%(asctime)s - %(message)s"
)


def main():
    logging.info("Pipeline started.")
    try:
        print("hi")
        # generate_10_questions()
    except Exception as e:
        logging.info(f"Pipeline failed {e}")
    else:
        logging.info("Pipeline completed.")


if __name__ == "__main__":
    main()











import requests
import os
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API endpoint
url = "http://localhost:8182/chat"

# Path to the image
image_path = "/home/Mayank.Sharma/GV_Test/retriever/output/slide_4.jpg"
# question = 'apply reasoning and then then talk about the contextual content. the answer should be factual and come only from the content of the image. go as granular as possible. dont focus on the style / content type but the content. Also analyse the content and the speak about the content. if it contains the table, just give me the output in tabular format'
# question="""
# Analyze the given image and provide a detailed textual output based on the content type present in the image. Follow these specific instructions for different content types, aiming to replicate the detailed explanation as if presented to an audience.

# Content Types:
# Slide (Presentation Slide)
# Table
# Chart/Graph
# Visualization (Infographics, Diagrams, etc.)
# Text Block
# Instructions:
# 1. Slide (Presentation Slide)
# Title: Extract and provide the main title of the slide.
# Subtitles: Extract any subtitles or secondary headings.
# Bullet Points: List all bullet points or key points with precise content.
# Images/Diagrams: Describe any images or diagrams present, including their captions.
# Notes/Annotations: Extract any speaker notes or annotations if visible.
# Additional Elements: Capture any additional elements like timelines, icons, or visual markers with contextual details.
# Contextual Explanation: Provide a detailed narrative or explanation as if presenting the slide to an audience, explaining the significance of each element and how they relate to each other.
# 2. Table
# Table Title: Provide the title of the table.
# Column Headers: List all column headers.
# Row Headers: List all row headers.
# Cell Data: Extract the data from each cell, specifying the corresponding row and column for clarity. Include specific data points, checkmarks, or symbols.
# Footnotes/Annotations: Extract any footnotes or annotations related to the table.
# Contextual Explanation: Provide a detailed narrative explaining the table, highlighting key data points and trends, and their implications.
# 3. Chart/Graph
# Chart Title: Extract the title of the chart or graph.
# Type: Specify the type of chart (e.g., bar chart, pie chart, line graph).
# Axis Titles: Provide the titles of the X and Y axes.
# Legend: Extract the legend entries and their corresponding colors or markers.
# Data Points: List the data points, specifying the values and their corresponding categories or labels.
# Trend Lines/Markers: Describe any trend lines or special markers.
# Notes/Annotations: Extract any notes or annotations related to the chart.
# Contextual Explanation: Provide a detailed narrative explaining the chart, interpreting the data points, trends, and their significance.
# 4. Visualization (Infographics, Diagrams, etc.)
# Title: Extract the main title of the visualization.
# Sections/Subsections: Describe the main sections or subsections of the visualization.
# Key Elements: List and describe key elements, icons, or symbols used.
# Data Points/Statistics: Extract any data points, statistics, or key figures.
# Flow/Hierarchy: Describe any flow or hierarchical structure present.
# Notes/Annotations: Extract any notes or annotations related to the visualization.
# Contextual Explanation: Provide a detailed narrative explaining the visualization, describing the relationships between elements, key insights, and overall message.
# 5. Text Block
# Title: Extract the title of the text block if present.
# Paragraphs: Break down the text into paragraphs and provide each paragraph separately.
# Headings/Subheadings: Extract any headings or subheadings.
# Lists: Extract any ordered or unordered lists, detailing each item.
# Quotes: Identify and extract any quotes or highlighted text.
# Footnotes/Annotations: Extract any footnotes or annotations related to the text block.
# Contextual Explanation: Provide a detailed narrative explaining the text block, summarizing the main points and their implications.
# General Instructions:
# Formatting: Ensure the extracted text retains any original formatting such as bold, italics, or underlining.
# Accuracy: Strive for high accuracy in transcribing the text and data.
# Contextual Notes: Provide contextual notes or explanations where necessary to enhance understanding.
# Language: Ensure the output is in clear and coherent English.
# Comprehensive Extraction: Make sure all visible text, symbols, and data points are captured and described in detail.
# """
# question="Extract the content of the slide, analyse, understand and then Provide a detailed narrative or explanation as if presenting the slide to an audience, explaining the significance of each element and how they relate to each other."
question = "Tell me about workshop idea of interest"

# question="extract data from the table and put in right structure"


def send_infer_request(image_path, question):
    """Send image and question to the chat API and get the response"""
    try:
        with open(image_path, "rb") as file:
            files = {"file": file}
            data = {"question": question}
            logger.info(f"Sending request for {image_path} with question: {question}")
            start_time = time.time()
            response = requests.post(url, files=files, data=data)
            end_time = time.time()
            duration = end_time - start_time
            logger.info(f"Response status code: {response.status_code}")
            logger.info(f"Inferencing time for {image_path}: {duration:.2f} seconds")
            if response.status_code != 200:
                logger.error(f"Response content: {response.content}")
            response.raise_for_status()  # Raise an exception for HTTP errors
            return response.json()
    except requests.RequestException as e:
        logger.error(f"Request failed for {image_path}: {e}")
        return {"error": f"Failed to process {image_path}"}


# Send the request and get the response
result = send_infer_request(image_path, question)
if "error" in result:
    logger.error(f"Error processing {image_path}: {result['error']}")
else:
    generated_text = result["generated_text"]
    print(f"Generated text: {generated_text}")













from fastapi import FastAPI, HTTPException, UploadFile, File, Form
import torch
from PIL import Image
from transformers import AutoModel, AutoTokenizer
import os
import logging
import uvicorn

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Load the model and tokenizer with float16 precision
model_name = 'openbmb/MiniCPM-Llama3-V-2_5-int4'
model = AutoModel.from_pretrained(model_name, trust_remote_code=True)
#model = model.to(device='cuda')
tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
model.eval()

@app.post("/chat")
async def chat_with_image(question: str = Form(...), file: UploadFile = File(...)):
    try:
        logger.info(f"Received question: {question}")
        logger.info(f"Received file: {file.filename}")

        # Load the image
        image = Image.open(file.file).convert('RGB')

        # Prepare the messages
        msgs = [{'role': 'user', 'content': question}]

        # Perform the chat operation
        res = model.chat(
            image=image,
            msgs=msgs,
            tokenizer=tokenizer,
            sampling=True,
            temperature=0.7
        )

        generated_text = res
        logger.info(f"Generated text: {generated_text}")

        return {"generated_text": generated_text}

    except Exception as e:
        logger.error(f"Internal server error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

@app.post("/chat-stream")
async def chat_with_image_stream(question: str = Form(...), file: UploadFile = File(...)):
    try:
        logger.info(f"Received question: {question}")
        logger.info(f"Received file: {file.filename}")

        # Load the image
        image = Image.open(file.file).convert('RGB')

        # Prepare the messages
        msgs = [{'role': 'user', 'content': question}]

        # Perform the chat operation with streaming
        res = model.chat(
            image=image,
            msgs=msgs,
            tokenizer=tokenizer,
            sampling=True,
            temperature=0.7,
            stream=True
        )

        generated_text = ""
        for new_text in res:
            generated_text += new_text
            logger.info(f"Generated text (streaming): {new_text}")

        return {"generated_text": generated_text}

    except Exception as e:
        logger.error(f"Internal server error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")

# Run the FastAPI app with Uvicorn
if __name__ == "__main__":
    uvicorn.run("pic2text:app", host="0.0.0.0", port=8182)



























[Unit]
Description=Gunicorn instance serve Fast app
After=network.target

[Service]
User=Mayank.Sharma
Group=www-data
WorkingDirectory=/home/Mayank.Sharma/GV_Test/backend/fast
Environment="PATH=/home/Mayank.Sharma/anaconda3/envs/GV_Test/bin"
ExecStart=/home/Mayank.Sharma/anaconda3/envs/GV_Test/bin/gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --preload --bind 0.0.0.0:6677
Restart=on-failure

[Install]
WantedBy=multi-user.target












[Unit]
Description=Gunicorn instance serve Flask Piepline app
After=network.target

[Service]
User=mayank.sharma9@evalueserve.com
Group=www-data
WorkingDirectory=/home/mayank.sharma9/GV/ingestion
Environment="PATH=/home/mayank.sharma9/ingestion/bin" 
ExecStart=/home/mayank.sharma9/ingestion/bin/gunicorn --workers 3 --bind unix:pipeline_flask_frontend.sock -m 007 wsgi_pipeline:app
Restart=on-failure

[Install]
WantedBy=multi-user.target

















server{
        listen 443 ssl;
        server_name 20.191.112.232;

        ssl_certificate /home/Mayank.Sharma/GV_Test/backend/fast/certificates/certificate.pem;
        ssl_certificate_key /home/Mayank.Sharma/GV_Test/backend/fast/certificates/private-key.pem;

        ssl_protocols TLSv1.2 TLSv1.3;

        location / {
                proxy_pass http://127.0.0.1:6677;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;

        # Disable buffering to enable streaming
                proxy_buffering off;
                proxy_cache off;
                proxy_request_buffering off;
        }
}

server{
        listen 80 ssl;
        server_name 20.191.112.232;

        location /api {
                proxy_pass https://localhost:8080;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
        }

        location /flask {
                proxy_pass http://unix:/home/Mayank.Sharma/GV_Test/backend/flask/app.sock;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /flask_pipeline {
                proxy_pass http://unix:/home/Mayank.Sharma/GV_Test/pipeline_flask_frontend.sock;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
        }
}





















































