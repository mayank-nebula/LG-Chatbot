class DataAnalysisAgent:
    def __init__(self):
        self.registry = DictionaryRegistry()
        self.llm = AzureManager.get_llm()
        self.agent = self._create_agent()
    
    def get_value_by_name(self, variable_name: str) -> Dict[str, Any]:
        """
        Retrieve the value associated with 'key' from a registered dictionary.
        
        Args:
            variable_name (str): Name of the registered dictionary.
            
        Returns:
            Dict[str, Any]: The value corresponding to the key in the specified dictionary or None if dictionary or key does not exist.
        """
        dictionary = self.registry.get_dictionary(variable_name)
        
        if dictionary is None:
            return None
        
        return dictionary.get("result")
    
    def _prepare_data(self) -> str:
        """Prepare all registered data for the prompt."""
        all_dicts = list_registered_dictionaries()
        all_data = []
        
        for indl_dict in all_dicts:
            all_data.append(get_dictionary_except_result(variable_name=indl_dict))
        
        return "\n".join(all_data)
    
    def _create_prompt(self) -> str:
        """Create the agent prompt with data."""
        final_data = self._prepare_data()
        
        return f"""You are a data analysis assistant that must respond strictly based on the information provided in the dataset and use the information to get data from the tool. The tool expects a 'variable_name' which will return the actual data.

Tool:
1. get_value_by_name: Retrieve the value associated with 'key' from a registered dictionary.
   Args:
       variable_name (str): Name of the registered dictionary.
   Returns:
       Dict[str, Any]: The value corresponding to the key in the specified dictionary or None if dictionary or key does not exist.

Instructions:
1. Read the user's question carefully.
2. If the answer can be formed from the data provided in the prompt, use it directly without accessing the tool.
3. If additional data is needed, identify the correct variable_name and call the tool with that variable name.
4. Use the result to write a clear, complete and well structured answer.
5. Never invent data. Only answer using the provided data or the tool output.

Data:
{final_data}
"""
    
    def _create_agent(self):
        """Create the react agent."""
        prompt = self._create_prompt()
        
        return create_react_agent(
            model=self.llm,
            tools=[self.get_value_by_name],
            name="internal_data_expert",
            prompt=prompt,
        )
    
    def query(self, question: str):
        """Process a query using the agent."""
        return self.agent.invoke({"input": question})
    
    def refresh_data(self):
        """Refresh the agent with updated data."""
        self.agent = self._create_agent()
