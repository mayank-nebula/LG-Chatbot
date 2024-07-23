def img_prompt_func(data_dict):
    """Join the context into a single string"""
    formatted_texts = "\n".join(data_dict["context"]["texts"])
    formatted_summary = "\n".join(data_dict["context"]["summary"])

    messages = []

    if data_dict["context"]["image_present"] == "Yes":
        if data_dict["context"]["llm"] == "GPT":
            if data_dict["context"]["images"]:
                for image in data_dict["context"]["images"]:
                    image_message = {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image}"},
                    }
                    messages.append(image_message)
        else:
            if data_dict["context"]["images"]:
                for image in data_dict["context"]["images"]:
                    image_message = {
                        "type": "image_url",
                        "image_url": image,
                    }
                    messages.append(image_message)

    text_message = {
        "type": "text",
        "text": (
            "From the given context, please provide a well-articulated response to the asked question.\n"
            "Make sure not to provide an answer from your own knowledge.\n"
            "If you don't know the answer to any question, simply say 'I am not able to provide a response as it is not there in the context'.\n"
            "Please go through the provided context silently, think, and then provide a cohesive and relevant answer most suitable for the asked question.\n"
            "Maintain context from previous conversations to ensure coherent and relevant responses.\n\n"
            f"User's question: {data_dict.get('question', 'No question provided')}\n\n"
            f"{'Original content: ' if formatted_texts else ''}{formatted_texts if formatted_texts else ''}\n"
            f"{'Summary content: ' if formatted_summary else ''}{formatted_summary if formatted_summary else ''}\n\n"
            "Based on all this information, please provide a comprehensive and accurate response to the user's question."
        ),
    }
    messages.append(text_message)

    return [HumanMessage(content=messages)]


def multi_modal_rag_chain_source(retriever, llm_to_use, llm, image, filters):
    """Multi-modal RAG chain"""

    def combined_context(data_dict):
        context = {
            "texts": data_dict.get("texts", []),
            "images": data_dict.get("images", []),
            "summary": data_dict.get("summary", []),
            "llm": llm,
            "image_present": image,
            "filters": filters,
        }
        return context

    chain = (
        {
            "context": retriever
            | RunnableLambda(split_image_text_types)
            | RunnableLambda(combined_context),
            "question": RunnablePassthrough(),
        }
        | RunnableLambda(img_prompt_func)
        | llm_to_use
        | StrOutputParser()
    )

    return chain
