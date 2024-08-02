map_prompt_template = """
                      Write a detailed and elaborated summary of the following text that includes the main points and any important details.
                      Aim for a summary length of approximately 1500 words
                      {text}
                      """

map_prompt = PromptTemplate(template=map_prompt_template, input_variables=["text"])


combine_prompt_template = """
                      Write a comprehensive summary of the following text delimited by triple backquotes.
                      Aim for a summary length of approximately 800 words with out missing the important information the text.
                      ```{text}```
                      COMPREHENSIVE SUMMARY:
                      """

combine_prompt = PromptTemplate(template=combine_prompt_template, input_variables=["text"])


stuff_prompt_template = """
                      Write a detailed and elaborated summary of the following text that includes the main points and any important details.
                      Aim for a summary length of approximately 1500 words
                      {text}
                      """
                    
stuff_prompt = PromptTemplate(template=stuff_prompt_template, input_variables=["text"])

summary_chain = load_summarize_chain(llm, chain_type = "map_reduce", verbose = True,  map_prompt=map_prompt, combine_prompt=combine_prompt, return_intermediate_steps=True, )
