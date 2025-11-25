from typing import Dict, Any, Optional

from langgraph.prebuilt import create_react_agent

from logs import get_logger
from prompt import PromptLoader
from utils import (
    DictionaryRegistry,
    AzureManager,
    list_registered_dictionaries,
    get_dictionary_except_result,
)

logger = get_logger(__name__)


class InternalDataAgent:
    """
    Singleton support agent for handling internal data.
    Ensures only one instance (and one agent) exists per process.
    """

    _instance: Optional["InternalDataAgent"] = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, "_initialized"):
            self.registry = DictionaryRegistry()
            self.llm = AzureManager.get_llm()
            self._agent = None
            self._initialized = True

    def get_value_by_name(self, variable_name: str) -> Dict[str, Any]:
        """Retrieve a variable’s value from registered dictionaries."""
        dictionary = self.registry.get_dictionary(variable_name)

        if dictionary is None:
            return None

        if variable_name == "vital_health_services_disrupted":
            return None

        return dictionary.get("result")

    def prepare_data(self) -> list:
        """Collect all registered dictionaries except 'result'."""
        all_dicts = list_registered_dictionaries()
        all_data = []

        for indl_dict in all_dicts:
            all_data.append(get_dictionary_except_result(variable_name=indl_dict))

        return all_data

    async def create_agent(self):
        """Create the react agent if not already created."""
        if self._agent is not None:
            return self._agent

        final_data = self.prepare_data()
        prompt = await PromptLoader.render_prompt(
            filename="agent",
            prompt_key="internal_data_agent",
            final_data=final_data,
        )

        self._agent = create_react_agent(
            model=self.llm,
            tools=[self.get_value_by_name],
            name="internal_data_expert",
            prompt=prompt,
        )
        logger.info("Internal Data Agent initialized successfully.")
        return self._agent

    async def get_agent(self):
        """Return the initialized agent (creates it only once)."""
        if self._agent is None:
            await self.create_agent()
        return self._agent
