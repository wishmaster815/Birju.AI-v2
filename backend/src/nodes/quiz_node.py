import json
import re
import random
from typing import List, Dict

class QuizNode:
    def __init__(self, llm_model):
        self.llm = llm_model

    def _clean_json(self, text: str) -> str:
        """Remove code fences (```json ... ```) or other wrappers from the LLM output."""
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.MULTILINE)
        return cleaned.strip()

    def _safe_parse_json(self, text: str) -> list:
        """Try to extract a valid JSON array even if response is noisy."""
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            match = re.search(r"\[\s*{[\s\S]*}\s*\]", text)
            if match:
                try:
                    return json.loads(match.group(0))
                except Exception:
                    pass
            raise ValueError("Unable to extract valid JSON array from LLM output.")

    def _rebalance_answers(self, quiz_data: List[Dict]) -> List[Dict]:
        """If too many answers are same, randomize a few to improve balance."""
        answer_counts = {}
        for q in quiz_data:
            ans = q.get("answer", "").strip().upper()
            if ans in ["A", "B", "C", "D"]:
                answer_counts[ans] = answer_counts.get(ans, 0) + 1

        total = len(quiz_data)
        for ans, count in answer_counts.items():
            if count > total * 0.5:  # if >50% same answer
                for q in quiz_data:
                    if q["answer"].upper() == ans and random.random() < 0.4:
                        q["answer"] = random.choice(["A", "B", "C", "D"])
        return quiz_data

    def _ask_model(self, prompt: str) -> str:
        """Send prompt to Gemini model and return raw text content."""
        response = self.llm.generate_content(prompt)

        if hasattr(response, "text"):  # Common for Gemini API
            return response.text
        elif hasattr(response, "candidates"):
            # Extract text from Gemini structured response
            return response.candidates[0].content.parts[0].text
        elif isinstance(response, str):
            return response
        else:
            raise ValueError("Unexpected response format from LLM.")

    def generate_quiz_for_stage(self, focus_topics: List[str], stage_number: int) -> List[Dict]:
        """Generate exactly 15 diversified MCQs for given stage."""
        if not focus_topics:
            raise ValueError(f"No focus topics provided for Stage {stage_number}.")

        focus_str = ", ".join(focus_topics)

        # --- PROMPT (unchanged from your original) ---
        quiz_prompt = f"""
        Generate exactly 15 multiple-choice questions on the following skills/topics for a user in Stage {stage_number}:
        {focus_str}.

        Each question must:
        - Have 4 options in a JSON object, with keys "A", "B", "C", and "D".
        - Have exactly one correct answer, with the key being just the letter (e.g., "A").
        - Vary in difficulty (easy to tricky).
        - Be unique and well-structured.

        Return strictly valid JSON in this format:
        [
            {{
                "question": "string",
                "options": {{
                    "A": "The content for option A",
                    "B": "The content for option B",
                    "C": "The content for option C",
                    "D": "The content for option D"
                }},
                "answer": "A"
            }}
        ]
        Return only the JSON array, no extra text or explanations.
        """

        # --- Generate with retries ---
        for attempt in range(3):
            try:
                response_text = self._ask_model(quiz_prompt)
                cleaned = self._clean_json(response_text)
                quiz_data = self._safe_parse_json(cleaned)
            except Exception as e:
                print(f"Attempt {attempt + 1}: Failed to parse JSON - {e}")
                continue

            if not isinstance(quiz_data, list):
                continue

            # Handle missing questions (generate remainder)
            if len(quiz_data) < 15:
                missing = 15 - len(quiz_data)
                repair_prompt = f"""
                You previously failed to generate enough questions.
                Generate {missing} additional unique questions on the topics: {focus_str}.
                
                Follow this exact JSON structure for each question:
                {{
                    "question": "string",
                    "options": {{
                        "A": "Option A text",
                        "B": "Option B text",
                        "C": "Option C text",
                        "D": "Option D text"
                    }},
                    "answer": "B"
                }}
                
                Return ONLY the valid JSON array for the new questions.
                """
                try:
                    extra_text = self._ask_model(repair_prompt)
                    extra_clean = self._clean_json(extra_text)
                    extra_data = self._safe_parse_json(extra_clean)
                    if isinstance(extra_data, list):
                        quiz_data.extend(extra_data)
                except Exception:
                    pass

            # Trim/rebalance final list
            quiz_data = quiz_data[:15]
            quiz_data = self._rebalance_answers(quiz_data)

            if len(quiz_data) == 15:
                return quiz_data

        raise ValueError(f"Failed to generate 15 valid questions after retries (got {len(quiz_data)}).")
