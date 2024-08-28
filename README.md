from pymongo import MongoClient
from datetime import datetime

client = MongoClient(os.environ["MONGO_API_KEY"])
db = client[os.environ["MONGODB_COLLECTION"]]
collection_question = db["questions"]

for key, value in summarized_docs.items():
    question_list = []
    questions = question_generation(value)
    for question in questions:
        question_list.append(question["Question"])
    document = {
        "documentName": key,
        "questions": question_list,
        "updatedAt": datetime.utcnow(),
        "createAt": datetime.utcnow(),
    }
    result = collection_question.insert_one(document)
