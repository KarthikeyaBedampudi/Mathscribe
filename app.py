from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from PIL import Image, ImageOps
import io, base64
import torch
import os
import requests  # <-- Added for Gemini API

app = Flask(__name__)
CORS(app)

# Path to your local model folder
MODEL_PATH = r"C:\Apps-and-stuff\ai_math\Uni-MuMER\models\TrOCR_Math_handwritten"

# Load model and processor (offline)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
processor = TrOCRProcessor.from_pretrained(MODEL_PATH, local_files_only=True)
model = VisionEncoderDecoderModel.from_pretrained(MODEL_PATH, local_files_only=True).to(device)

def base64_to_pil(b64_string):
    """Convert base64 canvas image to proper PIL RGB image for TrOCR."""
    b64_string = b64_string.split(",")[1]  # Remove prefix
    image_data = base64.b64decode(b64_string)
    image = Image.open(io.BytesIO(image_data)).convert("L")  # grayscale
    image = ImageOps.invert(image)  # invert colors if needed
    image = image.resize((384, 384))  # TrOCR expects 384x384
    image = image.convert("RGB")  # 3 channels
    return image

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        image_b64 = data.get("image")
        if not image_b64:
            return jsonify({"error": "No image received"}), 400

        # Convert canvas image to PIL
        image = base64_to_pil(image_b64)

        # Preprocess and generate OCR
        pixel_values = processor(image, return_tensors="pt").pixel_values.to(device)
        generated_ids = model.generate(pixel_values)
        text = processor.decode(generated_ids[0], skip_special_tokens=True)

        return jsonify({"text": text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ----------------- Phase 2: Solve math problem with Gemini -----------------
@app.route("/solve", methods=["POST"])
def solve():
    try:
        data = request.json
        expression = data.get("expression")
        if not expression:
            return jsonify({"error": "No expression received"}), 400

        
        api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": os.getenv("GEMINI_API_KEY")
        }

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"Solve the following math problem and return only the answer: {expression}"}
                    ]
                }
            ]
        }

        response = requests.post(api_url, headers=headers, json=payload)
        response.raise_for_status()

       
        data = response.json()
        answer = data["candidates"][0]["content"]["parts"][0]["text"]

        return jsonify({"answer": answer})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True)
