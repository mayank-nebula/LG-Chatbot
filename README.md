# Function to save each question and answer immediately to CSV
def save_to_csv(question, question_value, answer):
    with open("questions_answers.csv", mode="a", newline="") as file:
        writer = csv.writer(file, quoting=csv.QUOTE_ALL)  # Quote all fields to handle commas
        writer.writerow([question, question_value, answer])

# Function to save updated questions dictionary to JSON
def save_questions_to_json(questions, filename="questions.json"):
    with open(filename, "w") as file:
        json.dump(questions, file, indent=4)

# Main logic
if __name__ == "__main__":
    # Initialize CSV file with headers only once
    with open("questions_answers.csv", mode="w", newline="") as file:
        writer = csv.writer(file, quoting=csv.QUOTE_ALL)  # Quote all fields for safety
        writer.writerow(["Question Key", "Question", "Answer"])  # Headers

    # Convert questions.keys() to a list to avoid runtime error as dictionary size changes
    for question_key in list(questions.keys()):
        question_value = questions[question_key]
        try:
            # Get the full answer for the current question
            answer = get_full_answer(url, question_key, question_value, headers)
            # Save the question and answer immediately
            save_to_csv(question_key, question_value, answer)
            print(f"Saved: Question - {question_value} | Answer - {answer}")
            # Remove the key from questions after saving
            del questions[question_key]
            # Save the updated questions dictionary back to JSON
            save_questions_to_json(questions)
        except Exception as e:
            print(f"An error occurred for question '{question_value}':", e)
