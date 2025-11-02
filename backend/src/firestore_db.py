import os
import json
from dotenv import load_dotenv
from google.cloud import firestore

load_dotenv()

firebase_key = os.getenv("FIREBASE_KEY")

if not firebase_key:
    raise ValueError("FIREBASE_KEY environment variable not set")

cred_dict = json.loads(firebase_key)

key_file = "firebase_key.json"
with open(key_file, "w") as f:
    json.dump(cred_dict, f)

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_file

db = firestore.Client()
