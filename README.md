import json
from typing import Dict
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
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
            await websocket.send_text(json.dumps(message))

    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            await connection.send_text(json.dumps(message))


manager = ConnectionManager()

@app.websocket("/ws/{userEmailId}")
async def websocket_endpoint(
    websocket: WebSocket,
    userEmailId: str,
):
    await manager.connect(websocket, userEmailId)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(userEmailId)
