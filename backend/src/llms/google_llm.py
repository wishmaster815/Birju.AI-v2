import os
import google.generativeai as genai
from dotenv import load_dotenv

class GoogleLLM:
    def __init__(self):
        load_dotenv()
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        if not self.google_api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment variables")

        genai.configure(api_key=self.google_api_key)

    def get_model(self, model_name="gemini-2.5-flash"):
        generation_config = {
            "temperature": 0.3,
        }

        llm = genai.GenerativeModel(
            model_name=model_name,
            generation_config=generation_config
        )

        return llm
