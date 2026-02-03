from pathlib import Path
from tinydb import TinyDB, Query

# BASE_DIR = dossier "BackEnd"
BASE_DIR = Path(__file__).resolve().parent.parent

# Dossier "BDD" à la racine BackEnd/BDD
BDD_DIR = BASE_DIR / "BDD"
BDD_DIR.mkdir(exist_ok=True)

# Fichiers JSON
db_users = TinyDB(BDD_DIR / "users.json")
db_history = TinyDB(BDD_DIR / "historique.json")

# Tables TinyDB
# Pourquoi table() ?
# - TinyDB peut contenir plusieurs tables dans le même fichier
# - ici on veut une structure claire et stable
dbuser = db_users.table("dbuser")
dbhistorique = db_history.table("dbhistorique")

# Objets Query réutilisables
UserQ = Query()
HistQ = Query()
