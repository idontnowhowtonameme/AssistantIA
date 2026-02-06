# BackEnd/app/database.py
from pathlib import Path
from tinydb import TinyDB, Query

# BASE_DIR = dossier "BackEnd"
BASE_DIR = Path(__file__).resolve().parent.parent

# Dossier "BDD" à la racine BackEnd/BDD
BDD_DIR = BASE_DIR / "BDD"
BDD_DIR.mkdir(exist_ok=True)

# Fichiers JSON (TinyDB)
db_users_file = TinyDB(BDD_DIR / "users.json")
db_history_file = TinyDB(BDD_DIR / "historique.json")
db_conversations_file = TinyDB(BDD_DIR / "conversations.json")

# Tables TinyDB
# Pourquoi table() ?
# - TinyDB peut contenir plusieurs tables dans un même fichier
# - on choisit des noms de tables stables et explicites
dbuser = db_users_file.table("dbuser")
dbhistorique = db_history_file.table("dbhistorique")
dbconversations = db_conversations_file.table("dbconversations")

# Objets Query réutilisables
UserQ = Query()
HistQ = Query()
ConvQ = Query()
