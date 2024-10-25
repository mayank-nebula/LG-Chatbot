def get_name_by_id(csv_file, id):
    df = pd.read_csv(csv_file)
    name = df.loc[df["ID"] == id, "Name"].values[0]
    return os.path.splitext(name)[0]


def delete_from_collection(collection, file_id, docstore_key):
    """
    Delete documents from a specific ChromaDB collection and gather metadata for further deletion.

    Parameters:
    collection: The ChromaDB collection from which documents will be deleted.
    file_id (str): The ID of the document to delete.
    docstore_key (str): The key used to extract metadata from the collection.

    Returns:
    list: A list of metadata IDs that need to be deleted from the docstore.
    """
    ids_to_delete = []

    name = get_name_by_id("files_metadata.csv", file_id)
    collection_question.delete_one({"documentName": name})

    # Retrieve documents matching the given file_id from the collection.
    collection_result = collection.get(where={"id": file_id})

    # Delete the documents from the collection.
    collection.delete(where={"id": file_id})

    # Extract and store metadata IDs for deletion from the docstore.
    for metadata in collection_result["metadatas"]:
        ids_to_delete.append(metadata[docstore_key])

    return ids_to_delete

def delete_from_vectostore(file_id_list):
    """
    Delete documents from both the ChromaDB collections and the docstores.

    Parameters:
    file_id_list (list): A list of document IDs to delete from the collections.
    """
    try:
        # Initialize lists to store metadata IDs that need deletion.
        normal_metadata = []
        summary_metadata = []

        # Iterate through each file ID and delete the corresponding documents.
        for file_id in file_id_list:
            normal_metadata.extend(
                delete_from_collection(
                    collection_normal, file_id, "GatesVentures_Scientia"
                )
            )
            summary_metadata.extend(
                delete_from_collection(
                    collection_summary, file_id, "GatesVentures_Scientia_Summary"
                )
            )

        logging.info("Document deleted successfully.")
        return normal_metadata, summary_metadata

    except Exception as e:
        # Log an error if the deletion process fails.
        logging.error(f"Failed to delete the doc. {e}")


2024-10-25 06:35:36,484 - ERROR - Failed to delete the doc. index 0 is out of bounds for axis 0 with size 0  
