from pathlib import Path
from tinydb import TinyDB, Query

BASE_DIR = Path(__file__).resolve().parent.parent

BDD_DIR = BASE_DIR / "BDD"
BDD_DIR.mkdir(exist_ok=True)

db_users_file = TinyDB(BDD_DIR / "users.json")
db_history_file = TinyDB(BDD_DIR / "historique.json")
db_conversations_file = TinyDB(BDD_DIR / "conversations.json")

dbuser = db_users_file.table("dbuser")
dbhistorique = db_history_file.table("dbhistorique")
dbconversations = db_conversations_file.table("dbconversations")

UserQ = Query()
HistQ = Query()
ConvQ = Query()
