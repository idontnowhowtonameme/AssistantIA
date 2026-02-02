from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from tinydb import TinyDB, Query

app = FastAPI()
db = TinyDB('./BDD/dbuser.json')  # base de donnée user
db = TinyDB('./BDD/dbhistorique.json') # base de donnée conversation

# Configuration CORS pour que ton FrontEnd puisse parler au BackEnd
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Port de Vike/React
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Serveur Assistant IA opérationnel !"}

@app.post("/test-db")
def test_db(name: str):
    # Insère une donnée dans TinyDB
    db.insert({'name': name, 'type': 'test'})
    return {"status": "Donnée enregistrée !", "nom": name}