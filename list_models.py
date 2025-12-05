import google.generativeai as genai
import os

# Read API key from the main script to avoid hardcoding it again
with open('generate_trivia_gemini.py', 'r') as f:
    for line in f:
        if line.strip().startswith('API_KEY ='):
            exec(line.strip())
            break

genai.configure(api_key=API_KEY)

print("Listing available models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Error listing models: {e}")
