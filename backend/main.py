from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Note Taking App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client["mobile-recharge-db"]
notes_collection = db["note_making"]

class NoteModel(BaseModel):
    title: str = Field(...)
    content: str = Field(...)

class UpdateNoteModel(BaseModel):
    title: Optional[str]
    content: Optional[str]

class NoteResponse(BaseModel):
    id: str
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

@app.on_event("startup")
async def startup_db_client():
    pass

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Maps a mongo document to our response schema
def note_helper(note) -> dict:
    return {
        "id": str(note["_id"]),
        "title": note["title"],
        "content": note["content"],
        "created_at": note.get("created_at"),
        "updated_at": note.get("updated_at")
    }

@app.post("/notes/", response_model=NoteResponse)
async def create_note(note: NoteModel):
    note_dict = note.dict()
    note_dict["created_at"] = datetime.utcnow()
    note_dict["updated_at"] = datetime.utcnow()
    new_note = await notes_collection.insert_one(note_dict)
    created_note = await notes_collection.find_one({"_id": new_note.inserted_id})
    return note_helper(created_note)

@app.get("/notes/", response_model=List[NoteResponse])
async def get_notes():
    notes = []
    async for note in notes_collection.find().sort("updated_at", -1):
        notes.append(note_helper(note))
    return notes

@app.get("/notes/{id}", response_model=NoteResponse)
async def get_note(id: str):
    from bson.objectid import ObjectId
    try:
        note = await notes_collection.find_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    if note:
        return note_helper(note)
    raise HTTPException(status_code=404, detail="Note not found")

@app.put("/notes/{id}", response_model=NoteResponse)
async def update_note(id: str, note: UpdateNoteModel):
    from bson.objectid import ObjectId
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    update_data = {k: v for k, v in note.dict().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        update_result = await notes_collection.update_one(
            {"_id": obj_id}, {"$set": update_data}
        )
        if update_result.modified_count == 1:
            if (updated_note := await notes_collection.find_one({"_id": obj_id})) is dict:
                pass
            updated_note = await notes_collection.find_one({"_id": obj_id})
            return note_helper(updated_note)
            
    if (existing_note := await notes_collection.find_one({"_id": obj_id})) is not None:
        return note_helper(existing_note)

    raise HTTPException(status_code=404, detail="Note not found")

@app.delete("/notes/{id}")
async def delete_note(id: str):
    from bson.objectid import ObjectId
    try:
        delete_result = await notes_collection.delete_one({"_id": ObjectId(id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")
        
    if delete_result.deleted_count == 1:
        return {"status": "Successfully deleted note"}

    raise HTTPException(status_code=404, detail="Note not found")
