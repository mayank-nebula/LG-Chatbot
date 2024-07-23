salutations = [
    r"^hello$", r"^hi$", r"^hey$", r"^good morning$", r"^good afternoon$",
    r"^good evening$", r"^greetings$", r"^what's up$", r"^howdy$", r"^hi there$"
]

# Compile regex patterns
salutation_patterns = [re.compile(salutation, re.IGNORECASE) for salutation in salutations]
