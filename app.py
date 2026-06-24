# -*- coding: utf-8 -*-
import os
import sys
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

# Force UTF-8 output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

app = Flask(__name__)

# Configure Gemini AI (new SDK)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
client = None

if GEMINI_API_KEY:
    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"Warning: Could not initialize Gemini client: {e}")


def build_recipe_prompt(food_item: str, language: str) -> str:
    """Build a structured prompt for the Gemini model."""

    language_instructions = {
        "english": "Respond entirely in English.",
        "tamil": "Respond entirely in Tamil language (use Tamil script). All headings, steps, ingredients and text must be in Tamil.",
        "telugu": "Respond entirely in Telugu language (use Telugu script). All headings, steps, ingredients and text must be in Telugu.",
    }

    lang_key = language.lower()
    lang_instruction = language_instructions.get(lang_key, language_instructions["english"])

    prompt = f"""You are FoodSage, an expert culinary AI assistant specializing in food recipes from around the world.

{lang_instruction}

The user is asking about: "{food_item}"

Please provide a detailed, well-structured recipe response in the following format:

1. **Dish Overview**: A brief, appetizing description of the dish (2-3 sentences).

2. **Ingredients**: List ALL required ingredients with exact quantities in a clear numbered or bulleted list.

3. **Step-by-Step Recipe**: Provide detailed cooking instructions, numbered step by step, including:
   - Preparation steps
   - Cooking steps
   - Timing for each step
   - Tips for best results

4. **Chef's Tips**: 2-3 pro tips to make the dish even better.

5. **Serving Suggestion**: How to serve and garnish the dish.

Make your response warm, encouraging, and easy to follow. If the query is NOT about food, politely redirect and ask for a food-related question.
"""
    return prompt


@app.route("/")
def landing():
    """Render the landing page."""
    return render_template("index.html")


@app.route("/chatbot")
def chatbot():
    """Render the chatbot page."""
    return render_template("chatbot.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    """Handle chat messages and return recipe responses."""
    try:
        data = request.get_json()
        user_message = data.get("message", "").strip()
        language = data.get("language", "english")

        if not user_message:
            return jsonify({"error": "Message cannot be empty"}), 400

        if not client:
            # Fallback demo response if no API key is set
            fallback = get_demo_response(user_message, language)
            return jsonify({"response": fallback, "status": "demo"})

        # Build prompt and get Gemini response (with fallback options for high reliability)
        prompt = build_recipe_prompt(user_message, language)
        reply = None
        last_error = None
        
        for model_name in [
            "gemini-3.5-flash", 
            "gemini-2.5-flash", 
            "gemini-3.1-flash-lite", 
            "gemini-2.5-flash-lite", 
            "gemini-flash-latest", 
            "gemini-flash-lite-latest"
        ]:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                reply = response.text
                if reply:
                    break
            except Exception as e:
                last_error = e
                print(f"Warning: Model {model_name} failed: {e}")
                continue

        if not reply:
            raise last_error if last_error else Exception("All models failed to generate a response.")

        return jsonify({"response": reply, "status": "success"})

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


def get_demo_response(food_item: str, language: str) -> str:
    """Provide a demo response when no API key is configured."""
    item = food_item.title()
    responses = {
        "english": f"""**{item} Recipe**

**Dish Overview:**
{item} is a beloved dish enjoyed by food lovers everywhere. Here is a classic recipe to prepare it at home with authentic flavours!

**Ingredients:**
- 2 cups of the main ingredient
- 1 tbsp cooking oil or butter
- 1 tsp cumin seeds
- 2 medium onions, finely chopped
- 2 tomatoes, pureed
- 1 tsp ginger-garlic paste
- Salt to taste
- Fresh coriander for garnish
- Spices: turmeric, chilli powder, garam masala

**Step-by-Step Recipe:**
1. **Prepare**: Wash and chop all ingredients. Keep spices ready.
2. **Heat Oil**: Heat oil in a pan over medium heat. Add cumin seeds.
3. **Saute Onions**: Add onions and fry until golden brown (5-7 min).
4. **Add Tomatoes**: Add tomato puree and cook until oil separates.
5. **Spices**: Add all spices and ginger-garlic paste. Cook 2 min.
6. **Main Ingredient**: Add the main ingredient, stir well.
7. **Cook**: Cover and cook on low heat for 15-20 minutes.
8. **Finish**: Adjust salt, garnish with fresh coriander.

**Chef's Tips:**
- Use fresh ingredients for the best flavour
- Cook on low heat for a richer, deeper taste
- A squeeze of lemon juice before serving adds brightness

**Serving Suggestion:**
Serve hot with steamed basmati rice, naan, or roti. Enjoy your meal!

> **Note:** This is a demo response. Please add your **Gemini API key** in the `.env` file for full AI-powered recipes!""",

        "tamil": f"""**{item} செய்முறை**

> **குறிப்பு:** இது ஒரு டெமோ பதில். முழுமையான தமிழ் AI பதில்களுக்கு `.env` கோப்பில் உங்கள் **Gemini API key** சேர்க்கவும்!

உங்கள் API key சேர்த்த பிறகு, நான் **{item}** செய்முறையை முழுமையாக தமிழில் வழங்குவேன்:

- பொருட்கள் பட்டியல் (அளவுகளுடன்)
- படிப்படியான சமையல் முறை
- சமையல் குறிப்புகள்
- பரிமாறும் முறை

FoodSage உங்கள் சமையல் தோழன்! :)""",

        "telugu": f"""**{item} వంటకం**

> **గమనిక:** ఇది ఒక డెమో స్పందన. పూర్తి తెలుగు AI స్పందనల కోసం `.env` ఫైల్‌లో మీ **Gemini API key** జోడించండి!

మీ API key జోడించిన తర్వాత, నేను **{item}** వంటకాన్ని పూర్తిగా తెలుగులో అందిస్తాను:

- పదార్థాల జాబితా (పరిమాణాలతో)
- దశలవారీ వంట విధానం
- వంట చిట్కాలు
- వడ్డించే విధానం

FoodSage మీ వంట సహాయకుడు! :)""",
    }

    lang_key = language.lower()
    return responses.get(lang_key, responses["english"])


if __name__ == "__main__":
    print("FoodSage Recipe Companion is starting...")
    print("Open your browser and go to: http://localhost:5000")
    print("Add your Gemini API key in .env file for full AI responses!")
    app.run(debug=True, port=5000)
