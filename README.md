from typing import Dict, Any
from langgraph.prebuilt import create_react_agent

from prompt import PromptLoader
from utils import (
    DictionaryRegistry,
    AzureManager,
    list_registered_dictionaries,
    get_dictionary_except_result,
)


class InternalDataAgent:
    def __init__(self):
        self.registry = DictionaryRegistry()
        self.llm = AzureManager.get_llm()
        self._agent = None  # store the created agent

    def get_value_by_name(self, variable_name: str) -> Dict[str, Any]:
        """
        Retrieve the value associated with 'variable_name' from a registered dictionary.
        """
        dictionary = self.registry.get_dictionary(variable_name)

        if dictionary is None:
            return None

        if variable_name == "vital_health_services_disrupted":
            return None

        return dictionary.get("result")

    def _prepare_data(self) -> str:
        """Prepare all registered data for the prompt."""
        all_dicts = list_registered_dictionaries()
        all_data = []

        for indl_dict in all_dicts:
            all_data.append(get_dictionary_except_result(variable_name=indl_dict))

        return all_data

    async def _create_agent(self):
        """Create the react agent if not already created."""
        if self._agent is not None:
            return self._agent

        final_data = self._prepare_data()
        prompt = await PromptLoader.render_prompt(
            filename="agent", prompt_key="internal_data_agent", final_data=final_data
        )

        self._agent = create_react_agent(
            model=self.llm,
            tools=[self.get_value_by_name],
            name="internal_data_expert",
            prompt=prompt,
        )
        return self._agent

    async def get_agent(self):
        """Return the initialized agent (creates it if missing)."""
        if self._agent is None:
            await self._create_agent()
        return self._agent
