import os
from ultralytics import YOLO
import requests

def download_yolov8n_models():
    """Download YOLOv8n models in both PyTorch (.pt) and ONNX formats."""
    # Create models directory if it doesn't exist
    os.makedirs("models", exist_ok=True)
    
    try:
        # Download PyTorch .pt format
        print("Downloading YOLOv8n PyTorch model...")
        pt_model = YOLO("yolov8n.pt")  # This will download if not found locally
        pt_path = "models/yolov8n.pt"
        
        # If the file was downloaded, move it to models directory
        if os.path.exists("yolov8n.pt"):
            os.rename("yolov8n.pt", pt_path)
        
        # Export to ONNX format
        print("Converting to ONNX format...")
        onnx_path = "models/yolov8n.onnx"
        if not os.path.exists(onnx_path):
            model = YOLO(pt_path)
            model.export(format="onnx", imgsz=[640, 640])
            
            # Move the exported ONNX file
            if os.path.exists("yolov8n.onnx"):
                os.rename("yolov8n.onnx", onnx_path)
        
        print("Download complete!")
        print(f"PyTorch model saved to: {pt_path}")
        print(f"ONNX model saved to: {onnx_path}")
        
    except Exception as e:
        print(f"Error downloading models: {e}")
        print("Please make sure you have the latest ultralytics package installed:")
        print("pip install --upgrade ultralytics")

def verify_downloads():
    """Verify that the model files were downloaded successfully."""
    required_files = {
        "PyTorch": "models/yolov8n.pt",
        "ONNX": "models/yolov8n.onnx"
    }
    
    all_exists = True
    for name, path in required_files.items():
        exists = os.path.exists(path)
        print(f"{name} model: {'Found' if exists else 'Missing'} at {path}")
        if not exists:
            all_exists = False
    
    return all_exists

if __name__ == "__main__":
    # Download models
    download_yolov8n_models()
    
    # Verify downloads
    if verify_downloads():
        print("All model files downloaded successfully!")
    else:
        print("Some model files failed to download. Please check errors above.")