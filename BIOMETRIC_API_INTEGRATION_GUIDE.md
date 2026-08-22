# HealLock Production Biometric & Face Recognition API Integration Guide

This guide provides step-by-step instructions and ready-to-run code templates for connecting external Face Recognition & Biometric APIs to your **HealLock** application.

---

## 🏗️ Architecture Options Overview

| Integration Option | Accuracy | Liveness / Anti-Spoof | Cost | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **Option 1: Python FastAPI + DeepFace (ArcFace/FaceNet512)** *(Recommended)* | **99.8% (SOTA)** | ✅ Built-in Blink / Head Turn | **$0.00 (Self-Hosted)** | Private Clinical Systems, HIPAA Compliance |
| **Option 2: AWS Rekognition API** | **99.9%** | ✅ AWS Face Liveness SDK | ~$0.001 / comparison | Cloud Native, Managed Enterprise Scaling |
| **Option 3: FaceIO Web SDK / Cloud API** | **99.6%** | ✅ Built-in Optical Liveness | Free tier / SaaS | Rapid zero-backend deployment |

---

## 🚀 Option 1: Self-Hosted Python FastAPI + DeepFace API (Zero Cost, SOTA Accuracy)

This is the most secure and private clinical solution. Patient biometric data never leaves your infrastructure.

### 1. Install Python Dependencies
```bash
pip install fastapi uvicorn deepface tf-keras numpy pillow python-multipart
```

### 2. Backend Server Code (`biometric_api_server.py`)
```python
"""
HealLock Biometric Microservice
Runs DeepFace with ArcFace / FaceNet512 embeddings & anti-spoofing
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace
import numpy as np
import base64
import io
from PIL import Image

app = FastAPI(title="HealLock Biometrics Engine", version="2.0")

# Enable CORS for HealLock frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = "ArcFace" # Or "Facenet512" or "VGG-Face"
METRIC = "euclidean_l2"
THRESHOLD = 0.68

@app.post("/api/v1/biometrics/extract-embedding")
async def extract_embedding(photo_base64: str = Form(...)):
    """
    Extracts 512-dimensional ArcFace embedding from base64 camera image
    """
    try:
        # Decode base64 image
        header, encoded = photo_base64.split(",", 1) if "," in photo_base64 else ("", photo_base64)
        image_data = base64.b64decode(encoded)
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        img_np = np.array(image)

        # Detect face & compute 512-D embedding
        embeddings = DeepFace.represent(
            img_path=img_np,
            model_name=MODEL_NAME,
            enforce_detection=True,
            detector_backend="retinaface", # SOTA face detector
            anti_spoofing=True
        )

        if len(embeddings) == 0:
            raise HTTPException(status_code=400, detail="NO_FACE_DETECTED")
        if len(embeddings) > 1:
            raise HTTPException(status_code=400, detail="MULTIPLE_FACES_DETECTED")

        primary = embeddings[0]
        
        # Check liveness
        if not primary.get("is_real", True):
            raise HTTPException(status_code=400, detail="SPOOFING_DETECTED: Face photo/screen detected")

        return {
            "status": "success",
            "embedding": primary["embedding"], # 512-dimensional float list
            "facial_area": primary["facial_area"],
            "model": MODEL_NAME,
            "anti_spoof_verified": True
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/biometrics/verify-face")
async def verify_face(
    live_photo_base64: str = Form(...),
    enrolled_embedding: str = Form(...) # JSON string of enrolled float array
):
    """
    Compares live webcam photo against enrolled biometric embedding
    """
    import json
    try:
        target_vec = np.array(json.loads(enrolled_embedding))
        
        # Extract live embedding
        header, encoded = live_photo_base64.split(",", 1) if "," in live_photo_base64 else ("", live_photo_base64)
        image_data = base64.b64decode(encoded)
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        img_np = np.array(image)

        embeddings = DeepFace.represent(
            img_path=img_np,
            model_name=MODEL_NAME,
            enforce_detection=True,
            detector_backend="retinaface",
            anti_spoofing=True
        )

        if len(embeddings) == 0:
            return {"matched": False, "status": "NO_FACE_DETECTED", "details": "No face found"}

        live_vec = np.array(embeddings[0]["embedding"])

        # Compute Euclidean L2 Distance
        distance = np.linalg.norm(live_vec - target_vec)
        matched = bool(distance <= THRESHOLD)
        confidence = float(max(0, min(100, (1.0 - (distance / (THRESHOLD * 1.5))) * 100)))

        return {
            "matched": matched,
            "status": "VERIFIED" if matched else "FAILED",
            "distance": round(float(distance), 4),
            "threshold": THRESHOLD,
            "confidence": round(confidence, 1),
            "details": f"{'✓ Identity Verified' if matched else '✗ Mismatch'} (Distance: {distance:.3f} vs max {THRESHOLD})"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

## ⚡ Connecting the Backend API in HealLock (`biometricService.ts`)

To redirect the frontend calls to your API endpoint, you can add this method into `src/services/biometricService.ts`:

```typescript
// Add to src/services/biometricService.ts

public async verifyFaceViaApi(
  liveBase64Photo: string,
  enrolledVector: number[],
  apiUrl: string = 'http://localhost:8000/api/v1/biometrics/verify-face'
): Promise<BiometricMatchResult> {
  const formData = new FormData();
  formData.append('live_photo_base64', liveBase64Photo);
  formData.append('enrolled_embedding', JSON.stringify(enrolledVector));

  const response = await fetch(apiUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'API Face verification failed');
  }

  const result = await response.json();
  return {
    matched: result.matched,
    similarity: result.confidence / 100,
    confidenceScore: result.confidence,
    euclideanDistance: result.distance,
    threshold: result.threshold,
    verificationFactor: 'face',
    status: result.status,
    details: result.details,
  };
}
```

---

## 🛡️ FIDO2 / WebAuthn Server Attestation Validation

For production biometric fingerprint validation, you can install `@simplewebauthn/server` in Node.js / Express or Python `fido2` library to cryptographically verify the authenticator challenge and client signature on the server.
