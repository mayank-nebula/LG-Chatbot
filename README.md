prompt_template = """
                      Write a comprehensive summary of the following text delimited by triple backquotes.
                      Aim for a summary length of approximately 250 words with out missing the important information the text.
                      ```{text}```
                      COMPREHENSIVE SUMMARY:
                      """

prompt = PromptTemplate.from_template(prompt_template)


llm_chain = LLMChain(llm=llm, prompt=prompt)
stuff_chain = StuffDocumentsChain(
        llm_chain=llm_chain, document_variable_name="text"
    )

def create_summary():
    try:
        # accumulated_value = " ".join(batch_summary.values())
        accumulated_value = """Large language models, also known as LLMs, are very large deep learning models that are pre-trained on vast amounts of data. The underlying transformer is a set of neural networks that consist of an encoder and a decoder with self-attention capabilities. The encoder and decoder extract meanings from a sequence of text and understand the relationships between words and phrases in it.
        Transformer LLMs are capable of unsupervised training, although a more precise explanation is that transformers perform self-learning. It is through this process that transformers learn to understand basic grammar, languages, and knowledge."""
        doc = Document(page_content=accumulated_value)
        summary_result = stuff_chain.invoke([doc])
        logging.info("Summary created successfully.")
        return summary_result["output_text"]
    except Exception as e:
        logging.error(f"Failed to create summary. {e}")
        return None
