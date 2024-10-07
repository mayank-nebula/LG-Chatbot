async def combine_fields_by_ids(ids):
    # Construct the aggregation pipeline
    pipeline = [
        {
            "$match": {
                "_id": { "$in": [ObjectId(id) for id in ids] }  # Replace ids with actual list of IDs
            }
        },
        {
            "$project": {
                "_id": 0,  # Exclude _id from the result
                "combinedField": {
                    "$concat": [
                        "$name", " - ", { "$toString": "$createdAt" }  # Concatenate name and createdAt as a string
                    ]
                }
            }
        }
    ]
    
    # Run the aggregation
    result = await collection.aggregate(pipeline).to_list(length=None)
    
    return result
