class ConnectionManager:
    def __init__(self):
        # Dictionary to map user_email_id to their WebSocket connection
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_email_id: str):
        await websocket.accept()
        self.active_connections[user_email_id] = websocket

    def disconnect(self, user_email_id: str):
        if user_email_id in self.active_connections:
            del self.active_connections[user_email_id]

    async def send_message(self, message: str, user_email_id: str):
        websocket = self.active_connections.get(user_email_id)
        if websocket:
            await websocket.send_text(message)

    async def broadcast(self, message: str):
        # Optionally, broadcast to all connected users (not needed in this case)
        for connection in self.active_connections.values():
            await connection.send_text(message)
