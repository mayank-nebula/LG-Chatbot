def create_summary(batch_summary):
    try:
        accumulated_value = " ".join(batch_summary.values())
        logging.info(f"Accumulated value length: {len(accumulated_value)}")
        
        doc = Document(page_content=accumulated_value)
        logging.info("Document created successfully")
        
        summary_result = summary_chain.invoke([doc])
        logging.info(f"Summary chain invoked. Result type: {type(summary_result)}")
        
        if summary_result is None:
            logging.error("Summary result is None")
            return "Error: Unable to generate summary."
        
        if isinstance(summary_result, dict) and 'output_text' in summary_result:
            return summary_result['output_text']
        else:
            logging.error(f"Unexpected summary result format: {summary_result}")
            return str(summary_result)
    except Exception as e:
        logging.error(f"Failed to create summary. Error: {str(e)}", exc_info=True)
        return f"Error: {str(e)}"
