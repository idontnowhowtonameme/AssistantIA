# BackEnd/app/validators.py
import dns.resolver

def domain_has_mx(domain: str) -> bool:
    """
    Vérifie si le domaine possède un enregistrement MX (mail exchange).
    - Si pas de MX, il est très probable que le domaine ne reçoive pas d'emails.
    """
    try:
        answers = dns.resolver.resolve(domain, "MX")
        return len(answers) > 0
    except Exception:
        return False
