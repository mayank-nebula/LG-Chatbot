import motor.motor_asyncio
import asyncio

# Setup Motor client
client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
db = client.your_database_name  # Replace with your actual database name
collection = db.your_collection_name  # Replace with your actual collection name

# The query response you got from the LLM
query = {
    'filter': {'userEmailId': 'Mayank.Sharma9@evalueserve.com', 'sent_from_name': 'Kamal Chawla'},
    'projection': {'sent_to_name': 1, '_id': 0}
}

# Async function to execute the query
async def fetch_emails():
    result = await collection.find(query['filter'], query['projection']).to_list(length=100)
    return result

# Event loop to run the async function
if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    emails = loop.run_until_complete(fetch_emails())
    print(emails)
