import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ GEMINI_API_KEY not found")
    exit()

print("✅ GEMINI_API_KEY was found")
print("Key length:", len(api_key))

MODEL = "gemini-3.5-flash-lite"

print("Testing model:", MODEL)

try:
    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model=MODEL,
        contents="Summarize this in two sentences: The meeting is tomorrow at 10 AM. Please bring the project report."
    )

    print("\n✅ GEMINI API IS WORKING!")
    print("Response:")
    print(response.text)

except Exception as e:
    print("\n❌ GEMINI API ERROR")
    print("Error type:", type(e).__name__)
    print("Error:")
    print(e)