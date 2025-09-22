def get_dictionary_except_result(var_name: str) -> Optional[dict]:
    """
    Retrieve a registered dictionary without the 'result' key.

    Args:
        var_name (str): Name of the registered dictionary.

    Returns:
        dict: Copy of the dictionary without the 'result' key,
              or None if dictionary not found.
    """
    registry = DictionaryRegistry()
    dictionary = registry.get_dictionary(var_name)

    if dictionary is None:
        print(f"Warning: Dictionary '{var_name}' not found in registry")
        return None

    # Return a shallow copy without 'result'
    return {k: v for k, v in dictionary.items() if k != "result"}
