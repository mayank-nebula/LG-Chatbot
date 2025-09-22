class DictionaryRegistry:
    """Singleton class to manage dictionary registration for agent tools."""
    
    _instance: Optional['DictionaryRegistry'] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._registry = {}
        return cls._instance
    
    def register(self, name: str, dictionary: dict) -> None:
        """Register a dictionary with a given name."""
        self._registry[name] = dictionary
    
    def get_registry(self) -> Dict[str, dict]:
        """Get the complete registry."""
        return self._registry
    
    def get_dictionary(self, name: str) -> Optional[dict]:
        """Get a dictionary by name."""
        return self._registry.get(name)
    
    def list_names(self) -> list:
        """Return a list of all registered dictionary names."""
        return list(self._registry.keys())
    
    def clear(self) -> None:
        """Clear all registered dictionaries."""
        self._registry.clear()

def register_dictionary(name: str, dictionary: dict) -> None:
    """
    Register a dictionary with a given name for later retrieval.
    
    Args:
        name (str): Name to associate with the dictionary.
        dictionary (dict): Dictionary to register.
    """
    registry = DictionaryRegistry()
    registry.register(name, dictionary)

def list_registered_dictionaries() -> list:
    """Return a list of all registered dictionary names."""
    registry = DictionaryRegistry()
    return registry.list_names()

def get_value_by_name(var_name: str, key: str) -> Any:
    """
    Retrieve the value associated with `key` from a registered dictionary.
    
    Args:
        var_name (str): Name of the registered dictionary.
        key (str): Key whose value is to be retrieved from the dictionary.
        
    Returns:
        Any: The value corresponding to the key in the specified dictionary, 
             or None if dictionary or key does not exist.
    """
    registry = DictionaryRegistry()
    dictionary = registry.get_dictionary(var_name)
    
    if dictionary is None:
        print(f"Warning: Dictionary '{var_name}' not found in registry")
        return None
    
    return dictionary.get(key)
