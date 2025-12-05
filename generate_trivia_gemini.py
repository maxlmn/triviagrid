import os
import json
import time
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

# --- CONFIGURATION ---
API_KEY = 'AIzaSyAGdEkCClIgv8Uci_XiflAcTYJ2aKvh3a4' # <--- PASTE YOUR KEY HERE
OUTPUT_FILE = "questions.json"
SETS_TO_GENERATE = 5  # Start small to test, then increase to 1000

# Configure Gemini
genai.configure(api_key=API_KEY)

# We use Flash because it's fast and efficient for data generation
model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    generation_config={
        "temperature": 0.9,
        "response_mime_type": "application/json", # Forces JSON output
    }
)

def generate_trivia_set(difficulty):
    """
    Generates a single set of 6 questions (one per category) for a specific difficulty.
    """
    prompt = f"""
    You are a trivia database generator for a "Trivial Pursuit" style game.
    Generate exactly 6 trivia questions, ONE for EACH of these categories: 
    - geo (Geography)
    - ent (Entertainment)
    - hist (History)
    - art (Art & Literature)
    - sci (Science)
    - sport (Sports)

    DIFFICULTY LEVEL: {difficulty} (Scale: 1=Easy/Basic, 7=Grandmaster/Obscure).
    
    CRITICAL RULES:
    1. The "type" field must be one of: 'country', 'city', 'year', 'person', 'thing', 'number'.
    2. The "a" (answer) must be SHORT (1-3 words max).
    3. The "q" (question) must be a complete, well-formed sentence.
    4. Do not duplicate common trivia. Try to find unique facts for level {difficulty}.
    5. Output must be a valid JSON Array containing exactly 6 objects.
    6. "distractors" must contain exactly 15 incorrect but plausible answers.

    JSON Schema per object:
    {{
      "cat": "geo",
      "diff": {difficulty},
      "type": "city",
      "q": "Question text here?",
      "a": "Answer",
      "distractors": ["Wrong1", "Wrong2", "...", "Wrong15"]
    }}
    """

    try:
        response = model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        print(f"Error generating level {difficulty}: {e}")
        return []

def main():
    all_questions = []
    
    # Load existing if you want to append (optional)
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, 'r') as f:
                all_questions = json.load(f)
            print(f"Loaded {len(all_questions)} existing questions.")
        except:
            pass

    print(f"Starting generation of {SETS_TO_GENERATE} sets...")

    for i in range(SETS_TO_GENERATE):
        # Cycle difficulty from 1 to 7
        difficulty = (i % 7) + 1
        
        print(f"Generating Set {i+1}/{SETS_TO_GENERATE} [Difficulty {difficulty}]...")
        
        new_set = generate_trivia_set(difficulty)
        
        if new_set:
            all_questions.extend(new_set)
            
            # Save progressively so you don't lose data if script crashes
            with open(OUTPUT_FILE, 'w') as f:
                json.dump(all_questions, f, indent=2)
        
        # Sleep briefly to be nice to the API rate limits
        time.sleep(1.5)

    print(f"Done! {len(all_questions)} total questions saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()