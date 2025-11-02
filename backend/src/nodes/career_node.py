import json
import re  # Added for cleanup

class CareerNode:
    def __init__(self, model):
        """
        Initialize the node with the configured GenerativeModel.
        
        Args:
            model: A pre-configured genai.GenerativeModel instance 
                   from the GoogleLLM class.
        """
        # This is correct. It just saves the model.
        self.model = model

    def generate_guidance(self, user_input: dict) -> dict:
        """
        Generate an in-depth career counseling report in STRICT JSON format.
        """

        # Your prompt string (unchanged)
        prompt = f"""
        You are an elite career strategist and empathetic counselor for a top-tier advisory firm.
        Your task is to generate a personalized, premium-quality **career counseling report** in STRICT JSON format.

        The student has provided the following information:
        - Education: {user_input.get("education")}
        - Field/Domain of Interest: {user_input.get("field")}
        - Current Skills: {user_input.get("skills")}
        - Career Intent / Goal: {user_input.get("intent")}
        {"- Target Role: " + user_input.get("target_role") if user_input.get("target_role") else ""}

        ---

        ### 🚨 HARD CONSTRAINTS (STRICT COMPLIANCE REQUIRED)

        1. Output **ONLY valid JSON** — nothing else.
        2. The JSON **MUST follow the exact schema and key order** given below.
        3. Do **NOT** rename, remove, or add keys.
        4. Always include **exactly three (3)** career pathways inside `"career_pathways"`.
        5. Each field must have **realistic, complete, and professional** content.
        6. Output must **start with `{{` and end with `}}`**.

        ---

        ### ⚙️ STRICT JSON SCHEMA TO FOLLOW EXACTLY

        {{
            "report_header": {{
                "title": "Personalized Career Strategy Report – DevOps & Freelancing Path",
                "introduction": "You’ve taken the first courageous step toward a dynamic and rewarding career in DevOps..."
            }},
            "profile_analysis": {{
                "education": "B.Tech",
                "interest_domain": "DevOps Development",
                "current_skills": "None (no formal technical skills yet)",
                "stated_goal": "Learn DevOps development and become a freelancer",
                "key_strengths": [
                    "Strong engineering foundation",
                    "Clear career intent",
                    "High motivation"
                ],
                "inferred_challenges": [
                    "Lack of hands-on experience",
                    "No portfolio"
                ],
                "market_alignment": {{
                    "Indian_market": "India’s IT outsourcing boom...",
                    "Global_market": "Globally, DevOps roles are growing rapidly..."
                }}
            }},
            "strategic_guidance": {{
                "situational_overview": "You’re at the start of your journey...",
                "clarity_strategy": "1. Learn core DevOps tools...\\n2. Build small projects...",
                "overarching_recommendation": "Focus on mastering Linux, scripting, and cloud basics."
            }},
            "career_pathways": [
                {{
                    "role": "DevOps Engineer",
                    "role_overview": {{
                        "description": "A DevOps Engineer bridges development and operations...",
                        "day_in_the_life": "You configure servers, manage pipelines, and deploy apps.",
                        "key_responsibilities": [
                            "Automate build and deployment pipelines",
                            "Manage Docker and Kubernetes"
                        ]
                    }},
                    "future_scope": {{
                        "India": "High demand across tech startups.",
                        "Global": "Top 5 most sought tech roles worldwide."
                    }},
                    "expected_salary": {{
                        "entry_level": "₹4–6 LPA",
                        "mid_level": "₹8–12 LPA",
                        "senior_level": "₹15–25 LPA"
                    }},
                    "skill_gaps": [
                        "Linux",
                        "Scripting",
                        "CI/CD"
                    ],
                    "career_path": "Junior DevOps → DevOps Engineer → Senior DevOps → Consultant",
                    "recommended_learning_resources": [
                        "Udemy – Docker Mastery",
                        "Coursera – AWS SysOps Administrator"
                    ],
                    "networking_and_branding_tip": "Create a GitHub repo for CI/CD pipelines.",
                    "birjuramai_promotion": "Use BirjuRamAI’s Roadmap Generator and personalized quizzes to upskill faster."
                }}
            ],
            "concluding_summary": {{
                "immediate_actions": [
                    "Enroll in Linux course",
                    "Push project to GitHub",
                    "Join online communities"
                ],
                "final_encouragement": "You’ve taken a powerful step forward..."
            }}
        }}
        """

        try:
            # Generate model output
            response_obj = self.model.generate_content(prompt)
            raw_json_text = response_obj.text
        
        except Exception as e:
            raise ValueError(f"Google API call failed: {e}")

        # 🧹 Clean up the output before parsing
        clean_text = raw_json_text.strip()
        clean_text = re.sub(r"^```(?:json)?", "", clean_text)
        clean_text = re.sub(r"```$", "", clean_text)
        clean_text = clean_text.strip()

        try:
            guidance_json = json.loads(clean_text)
        except json.JSONDecodeError as e:
            raise ValueError(
                f"❌ Failed to decode JSON from Google API: {e}\n\n"
                f"--- Raw Output ---\n{raw_json_text}\n"
            )

        return guidance_json
