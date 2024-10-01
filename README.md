File ~/anaconda3/envs/EmailAssistant/lib/python3.11/site-packages/chromadb/api/configuration.py:207, in ConfigurationInternal.from_json(cls, json_map)
    203 @classmethod
    204 @override
    205 def from_json(cls, json_map: Dict[str, Any]) -> Self:
    206     """Returns a configuration from the given JSON string."""
--> 207     if cls.__name__ != json_map.get("_type", None):
    208         raise ValueError(
    209             f"Trying to instantiate configuration of type {cls.__name__} from JSON with type {json_map['_type']}"
    210         )
    211     parameters = []
