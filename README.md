def general_chat(question):
    salutations = [
        r"hello",
        r"hi",
        r"hey",
        r"good\s*morning",
        r"good\s*afternoon",
        r"good\s*evening",
        r"greetings",
        r"what'?s?\s*up",
        r"howdy",
        r"hi\s*there",
        r"hiya",
        r"yo",
        r"aloha",
        r"bonjour",
        r"hola",
        r"ciao",
        r"namaste",
        r"salut",
        r"sup",
        r"g'?day",
        r"how'?s?\s*it\s*going",
        r"how\s*are\s*you",
        r"what'?s?\s*new",
        r"nice\s*to\s*meet\s*you",
        r"pleasure\s*to\s*meet\s*you",
    ]
    salutation_patterns = [
        re.compile(rf"^\s*{salutation}\s*[?!.,]?\s*$", re.IGNORECASE) for salutation in salutations
    ]
    for pattern in salutation_patterns:
        if pattern.match(question):
            return True
    return False
