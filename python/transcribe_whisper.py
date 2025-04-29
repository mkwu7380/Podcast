import sys
import whisper
import os

if len(sys.argv) < 2:
    print("Usage: python transcribe_whisper.py <audio_file_path>")
    sys.exit(1)

audio_path = sys.argv[1]

if not os.path.exists(audio_path):
    print(f"File not found: {audio_path}")
    sys.exit(1)

model = whisper.load_model("base")  # You can change to 'small', 'medium', 'large' for better accuracy
result = model.transcribe(audio_path)

print(result["text"].strip())
