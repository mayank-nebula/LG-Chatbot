def general_chat(question):
    salutations = [
        r"^hello$",
        r"^hi$",
        r"^hey$",
        r"^good morning$",
        r"^good afternoon$",
        r"^good evening$",
        r"^greetings$",
        r"^what's up$",
        r"^howdy$",
        r"^hi there$",
    ]

    salutation_patterns = [
        re.compile(salutation, re.IGNORECASE) for salutation in salutations
    ]

    for pattern in salutation_patterns:
        if pattern.match(question.strip()):
            return True
    return False

    elif "@GK" in question:
