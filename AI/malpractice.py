import gdown
import cv2
import os
import numpy as np

# Google Drive file ID (Extract from the shared link)
file_id = "1JYRtUHlztW_f26Y6JGItCRfSOAC0-fbv"
output_file = "downloaded_video.mp4"

# Download video from Google Drive
print("Downloading video...")
gdown.download(f"https://drive.google.com/uc?id={file_id}", output_file, quiet=False)

# Load pre-trained face detection model (Haar Cascade)
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# Open the downloaded video
cap = cv2.VideoCapture(output_file)

# Store detected face encodings
unique_faces = []

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break  # Stop if video ends

    # Convert frame to grayscale
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # Detect faces in the frame
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5, minSize=(30, 30))

    for (x, y, w, h) in faces:
        # Extract face ROI (Region of Interest)
        face = gray[y:y + h, x:x + w]
        face_resized = cv2.resize(face, (100, 100))  # Normalize face size
        face_vector = face_resized.flatten()  # Convert to 1D vector
        
        # Check if the face is new
        if not any(np.array_equal(face_vector, f) for f in unique_faces):
            unique_faces.append(face_vector)

# Release resources
cap.release()

# Output the total number of unique faces detected
print(f"Total unique faces detected: {len(unique_faces)}")

# Delete the downloaded video
os.remove(output_file)
print("Video deleted.")

