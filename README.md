def convert_llm_to_mongodb_pipeline(llm_output: Dict[str, Any]) -> List[Dict[str, Any]]:
    pipeline = []
    
    # Mapping LLM output keys to MongoDB aggregation stages
    stage_mapping = {
        'filter': '$match',
        'count': '$count',
        'sort': '$sort',
        'project': '$project',
        'group': '$group',
        'limit': '$limit',
        'skip': '$skip',
        'unwind': '$unwind'
        # Add more mappings as needed
    }
    
    for key, content in llm_output.items():
        if content or key == 'count':  # Include 'count' even if it's an empty dict
            stage = stage_mapping.get(key, f'${key}')
            if key == 'count' and isinstance(content, dict) and not content:
                pipeline.append({stage: 'count'})
            else:
                pipeline.append({stage: content})
    
    return pipeline
