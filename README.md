from langchain_core.prompts import ChatPromptTemplate
def load_prompts():
    with open("prompts.json", "r") as file:
        return json.load(file)


prompts = load_prompts()


def format_chat_history(chat_history: list) -> str:
    """
    Formats chat history into a human-readable string for processing by the LLM.

    Args:
    - chat_history (list): A list of dictionaries containing user and AI responses.

    Returns:
    - str: A formatted string of chat history.
    """
    try:
        return "\n".join(
            [f"Human: {chat['user']}\nAssistant: {chat['ai']}" for chat in chat_history]
        )
    except KeyError as e:
        raise ValueError(f"Key missing in chat history: {str(e)}")
    except Exception as e:
        raise Exception(f"Error formatting chat history: {str(e)}")
