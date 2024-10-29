import requests
import csv
import json

# Define the API endpoint
url = "http://localhost:6677"

# Read questions from a JSON file
with open("questions.json", "r") as file:
    questions = json.load(file)  # Format: {"question1": "", "question2": "", ...}

# Headers (if required)
headers = {
    "Content-Type": "application/json"
}

# Function to send the request and accumulate the streamed response until the end
def get_full_answer(url, question, headers):
    accumulated_answer = ""
    with requests.post(url, json={"question": question}, headers=headers, stream=True) as response:
        for line in response.iter_lines():
            if line:
                line_data = json.loads(line.decode('utf-8'))
                # Accumulate only if the type is "answer"
                if line_data.get("type") == "answer":
                    accumulated_answer += line_data.get("context", "")
                # Break on "sources" type indicating the end of the response
                elif line_data.get("type") == "sources":
                    break
    return accumulated_answer

# Process each question and save question and answer in CSV
def save_to_csv(data):
    with open("questions_answers.csv", mode="a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["Question", "Answer"])  # Write header once
        for question, answer in data.items():
            writer.writerow([question, answer])

# Main logic
if __name__ == "__main__":
    answers = {}
    for question in questions.keys():
        try:
            # Get the full answer for the current question
            answer = get_full_answer(url, question, headers)
            answers[question] = answer
            print(f"Saved: Question - {question} | Answer - {answer}")
        except Exception as e:
            print(f"An error occurred for question '{question}':", e)

    # Save all question-answer pairs to CSV
    save_to_csv(answers)
