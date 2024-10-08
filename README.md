def convert_llm_to_mongodb_pipeline(llm_output: Dict[str, Any]) -> List[Dict[str, Any]]:
    pipeline = []
    
    for stage, content in llm_output.items():
        if content:  # Only add non-empty stages
            if stage == 'count' and isinstance(content, dict) and not content:
                # Special handling for empty count dict
                pipeline.append({'$count': 'count'})
            else:
                pipeline.append({f'${stage}': content})
    
    return pipeline
