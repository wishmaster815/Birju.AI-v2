import json
import re
from src.states.roadmap_state import RoadmapState, Roadmap


class RoadmapNode:
    def __init__(self, llm_model):
        """
        llm_model: instance of genai.GenerativeModel (from google_llm.py)
        Example:
            from src.llms.google_llm import llm_model
            node = RoadmapNode(llm_model)
        """
        self.llm_model = llm_model

    def _clean_json(self, text: str) -> str:
        """
        Remove code fences (```json ... ```) and trim extra whitespace.
        """
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.MULTILINE)
        return cleaned.strip()

    def generate_roadmap(self, state: RoadmapState) -> RoadmapState:
        """
        Generate a roadmap based on role, level, skills, and duration.
        Fully compatible with the Pydantic model having `overview_stages` and `plan`.
        """

        prompt = r"""
You are an expert roadmap designer.  
Generate a detailed, adaptive learning roadmap in **valid JSON format only**.

---

### USER INPUT
Role: {role}  
Level: {level}  
Skills / Topics: {skills}  
Duration: {duration_days} days  

---

### GOAL
Create a roadmap with:
1. `"overview_stages"` — general difficulty grouping (Beginner → Intermediate → Advanced → Expert)
2. `"plan"` — a **granular, time-based breakdown (minimum 6 stages)** of the full duration

---

### STRICT INSTRUCTIONS

####  For "overview_stages":
- Create 3–4 broad stages (Beginner, Intermediate, Advanced, Expert)
- Each stage includes:
  - `"overview_stage"` → string (e.g., "Intermediate")
  - `"skills"` → 5–8 descriptive learning objectives
  - `"actions"` → 4–8 real-world project tasks or applications

####  For "plan":
- Divide the total `{duration_days}` logically into **at least 1 and up to 12 smaller stages**.
- Each stage represents **a focused learning block**.
- Include:
  - `"stage"` → sequential number
  - `"approx_days"` → estimated days (sum ≈ `{duration_days}`)
  - `"focus"` → 3–6 precise, testable goals for that period.

#### Important Rules:
- Stage count logic:
  - If `{duration_days}` ≤ 45 → 6 stages  
  - If `{duration_days}` between 46–90 → 8 stages  
  - If `{duration_days}` > 90 → 10–12 stages  
- Distribute `{skills}` progressively from foundational to advanced.
- Earlier stages = fundamentals and setup.
- Later stages = integration, optimization, and deployment.
- Each `"focus"` must start with action verbs like "Build", "Implement", "Optimize", or "Integrate".
- Output must be **pure JSON** — no markdown or text commentary.

---

### Example Output Format

{{
  "overview_stages": [
    {{
      "overview_stage": "Beginner",
      "skills": [
        "Understand semantic HTML structure",
        "Learn CSS layout fundamentals"
      ],
      "actions": [
        "Build a personal homepage using HTML and CSS",
        "Create a responsive blog layout"
      ]
    }},
    {{
      "overview_stage": "Intermediate",
      "skills": [
        "Learn DOM manipulation and event handling with JavaScript",
        "Implement responsive design and animation"
      ],
      "actions": [
        "Develop a JavaScript to-do app",
        "Build an API-based weather dashboard"
      ]
    }}
  ],
  "plan": [
    {{
      "stage": 1,
      "approx_days": 10,
      "focus": [
        "Learn HTML fundamentals and semantic structure",
        "Practice basic tags, forms, and hyperlinks"
      ]
    }},
    {{
      "stage": 2,
      "approx_days": 12,
      "focus": [
        "Master CSS selectors, colors, and layout techniques",
        "Experiment with Flexbox and Grid"
      ]
    }},
    {{
      "stage": 3,
      "approx_days": 10,
      "focus": [
        "Apply responsive design using media queries",
        "Create a landing page project"
      ]
    }},
    {{
      "stage": 4,
      "approx_days": 15,
      "focus": [
        "Learn JavaScript DOM manipulation and events",
        "Build a small interactive app"
      ]
    }},
    {{
      "stage": 5,
      "approx_days": 18,
      "focus": [
        "Master React components and hooks",
        "Integrate APIs and manage state"
      ]
    }},
    {{
      "stage": 6,
      "approx_days": 15,
      "focus": [
        "Deploy and optimize the application for production"
      ]
    }}
  ]
}}

---

### Output Requirements:
- Output **must contain** both `"overview_stages"` and `"plan"` arrays.
- `"plan"` must have **minimum 6 stages**.
- Output **only JSON** (no markdown, no commentary).
"""

        # 🔹 Escape all non-placeholder braces safely
        prompt_safe = prompt.replace("{", "{{").replace("}", "}}")
        # 🔹 Re-enable placeholders for format()
        prompt_safe = (
            prompt_safe.replace("{{role}}", "{role}")
            .replace("{{level}}", "{level}")
            .replace("{{skills}}", "{skills}")
            .replace("{{duration_days}}", "{duration_days}")
        )

        # 🔹 Fill in dynamic values
        final_prompt = prompt_safe.format(
            role=state["role"],
            level=state["level"],
            skills=", ".join(state["skills"]),
            duration_days=state["duration"],
        )

        # 🔹 Generate content via Google Gemini model
        response = self.llm_model.generate_content(final_prompt)
        raw_output = response.text if hasattr(response, "text") else str(response)

        # 🔹 Clean JSON
        cleaned_response = self._clean_json(raw_output)

        # 🔹 Parse JSON safely
        try:
            roadmap_json = json.loads(cleaned_response)
            roadmap = Roadmap(**roadmap_json)
        except Exception as e:
            raise ValueError(
                f"❌ Invalid roadmap JSON: {e}\n\n--- Raw Output ---\n{raw_output}\n\n--- Cleaned Output ---\n{cleaned_response}"
            )

        # 🔹 Return updated state
        updated_state = {**state, "roadmap": roadmap}
        return updated_state
