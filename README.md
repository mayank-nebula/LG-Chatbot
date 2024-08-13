text_message = {
            "type": "text",
            "text": (
                "Generate a cohesive summary based on the questions asked of the entire document by synthesizing the key points and insights across all slides or pages .\n"
                "Avoid providing a slide-by-slide or section-by-section breakdown. Instead focus on creating a unified narrative that captures the overall message and detail.\n"
                "The summary should read as a continous text, emphasizing the document's main ideas and conclusion.\n"
                "Avoid adding thank you as the conclusion.\n"
                "Make sure not to provide an answer from your own knowledge.\n"
                "Maintain context from previous conversations to ensure coherent and relevant responses.\n"
                "If you don't know the answer to any question, simply say 'I am not able to provide a response as it is not there in the context'.\n"
                "Never answer from your own knowledge source, always asnwer from the provided context.\n"
                f"User's question: {data_dict.get('question', 'No question provided')}\n\n"
                f"{'Last Time the answer was not good and the reason shared by user is :' if reason else ''}{reason if reason else ''}{' .Generate Accordingly' if reason else '' }"
                f"{'Original content: ' if formatted_texts else ''}{formatted_texts if formatted_texts else ''}\n"
                f"{'Summary content: ' if formatted_summary else ''}{formatted_summary if formatted_summary else ''}\n\n"
                f"{'Previous conversation: ' if chatHistory else ''}{chatHistory if chatHistory else ''}\n\n"
                "Based on all this information, please provide a comprehensive and accurate response to the user's question."
                "Give me answer in markdown with well defined formatting and spacing. Use headings, subheadings, bullet points, wherever needed."
            ),
        }
