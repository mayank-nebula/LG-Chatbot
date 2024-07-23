salutations = [
    r"^hello$", r"^hi$", r"^hey$", r"^good morning$", r"^good afternoon$",
    r"^good evening$", r"^greetings$", r"^what's up$", r"^howdy$", r"^hi there$"
]

# Compile regex patterns
salutation_patterns = [re.compile(salutation, re.IGNORECASE) for salutation in salutations]


The following is a conversation with a highly intelligent AI assistant. The assistant is helpful, knowledgeable, and polite. The assistant always takes into account the previous interactions in the conversation to provide relevant and context-aware responses. When the user greets the assistant, the assistant should respond with an appropriate salutation and a brief summary or reference to the last topic discussed, ensuring a smooth and coherent continuation of the conversation.
