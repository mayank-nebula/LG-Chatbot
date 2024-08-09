from transformers import DetrImageProcessor, DetrForObjectDetection
import torch
from PIL import Image, ImageDraw, ImageFont
import os
import numpy as np
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load the processor and model
model_name = "TahaDouaji/detr-doc-table-detection"
processor = DetrImageProcessor.from_pretrained(model_name)
model = DetrForObjectDetection.from_pretrained(model_name)
model.eval()

# Function to draw bounding boxes
def draw_boxes(image, boxes, labels, scores, id2label):
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()

    for box, label, score in zip(boxes, labels, scores):
        box = [round(i, 2) for i in box.tolist()]
        draw.rectangle(box, outline="red", width=3)
        draw.text((box[0], box[1]), f"{id2label[label.item()]}: {round(score.item(), 3)}", fill="red", font=font)

    return image

# Function to crop and save detected tables
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

def detect_tables(image_path, output_dir):
    try:
        # Load and validate the image
        image = Image.open(image_path).convert('RGB')

        # Convert the image to a numpy array
        image_array = np.array(image)

        # Prepare inputs and perform inference
        inputs = processor(images=image_array, return_tensors="pt")
        outputs = model(**inputs)

        # Post-process the outputs to get the bounding boxes and labels
        target_sizes = torch.tensor([image.size[::-1]])
        results = processor.post_process_object_detection(outputs, target_sizes=target_sizes, threshold=0.85)[0]

        # Print the detected tables
        for score, label, box in zip(results["scores"], results["labels"], results["boxes"]):
            box = [round(i, 2) for i in box.tolist()]
            logger.info(
                f"Detected {model.config.id2label[label.item()]} with confidence "
                f"{round(score.item(), 3)} at location {box}"
            )

        # Draw the bounding boxes on the image
        image_with_boxes = draw_boxes(image.copy(), results["boxes"], results["labels"], results["scores"], model.config.id2label)

        # Save the image with bounding boxes
        output_path = os.path.join(output_dir, 'image_with_boxes.png')
        image_with_boxes.save(output_path)
        logger.info(f"Image with bounding boxes saved to {output_path}")

        # Crop and save the detected tables
        cropped_images = crop_and_save(image, results["boxes"], output_dir)

        return {"message": "Tables detected and processed successfully", "cropped_images": cropped_images}
    
    except Exception as e:
        logger.error(f"Error in detecting tables: {e}")
        raise RuntimeError("Error in detecting tables") from e
