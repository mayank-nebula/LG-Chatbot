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

# Run the FastAPI app with Uvicorn
if __name__ == "__main__":
    uvicorn.run("image2ocr:app", host="0.0.0.0", port=8181)
