"""
Passerelle WebSocket & API REST pour App Hermès Core (Channel Gateway)
Permet à l'application cliente d'interagir en temps réel avec les conteneurs Docker Hermès et Olympe.
"""

import os
import json
import asyncio
from typing import Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Hermes App Gateway Channel", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registre des conteneurs agents configurés
AGENT_REGISTRY = {
    "recouvrement": {
        "name": "Hermès Recouvrement",
        "alias": "Jérôme",
        "port": int(os.getenv("HERMES_RECOUVREMENT_PORT", 9229)),
        "host": os.getenv("HERMES_RECOUVREMENT_HOST", "hermes_recouvrement_agent"),
    },
    "commercial": {
        "name": "Hermès Commercial",
        "alias": "Lucas",
        "port": int(os.getenv("HERMES_COMMERCIAL_PORT", 9231)),
        "host": os.getenv("HERMES_COMMERCIAL_HOST", "hermes_commercial_agent"),
    },
    "support": {
        "name": "Hermès Support",
        "alias": "Clara",
        "port": int(os.getenv("HERMES_SUPPORT_PORT", 9232)),
        "host": os.getenv("HERMES_SUPPORT_HOST", "hermes_support_agent"),
    },
    "ao": {
        "name": "Hermès Appel d'Offre",
        "alias": "Victor",
        "port": int(os.getenv("HERMES_AO_PORT", 9233)),
        "host": os.getenv("HERMES_AO_HOST", "hermes_ao_agent"),
    }
}

SUPERVISOR_CONFIG = {
    "host": os.getenv("OLYMPE_SUPERVISOR_HOST", "olympe_supervisor"),
    "port": int(os.getenv("OLYMPE_SUPERVISOR_PORT", 9230))
}

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Hermes App Channel Gateway", "agents": len(AGENT_REGISTRY)}

@app.get("/api/agents")
async def list_agents():
    return {"agents": AGENT_REGISTRY}

@app.get("/api/olympe/directives")
async def get_olympe_directives():
    """Récupère les consignes transverses diffusées par Olympe."""
    return {
        "directives": [
            {
                "id": "ol-dir-104",
                "title": "Consigne Transverse : Pénalités L.441-10",
                "content": "Mise à jour automatique du taux légal des pénalités de retard (BCE + 10 points) appliquée à tous vos agents du parc.",
                "type": "compliance",
                "timestamp": "2026-09-01T12:00:00Z"
            }
        ]
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            raw_data = await websocket.receive_text()
            payload = json.loads(raw_data)
            agent_id = payload.get("agent_id", "recouvrement")
            user_content = payload.get("content", "")

            # Confirmation de réception
            await websocket.send_text(json.dumps({
                "type": "agent_thinking",
                "agent_id": agent_id,
                "step": f"Routing request to {AGENT_REGISTRY.get(agent_id, {}).get('name', 'Agent')}"
            }))

            # Echo ou transmission vers le conteneur cible
            await asyncio.sleep(0.3)
            await websocket.send_text(json.dumps({
                "type": "agent_message",
                "agent_id": agent_id,
                "content": f"Message reçu par la passerelle Hermès pour {agent_id}. Traitement en cours."
            }))
    except WebSocketDisconnect:
        pass

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
