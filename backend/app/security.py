"""
Autenticação simples para MVP de hackathon.

NÃO é adequado para produção: não tem recuperação de senha, verificação de
e-mail, proteção contra força bruta (rate limiting / bloqueio de conta),
rotação de chave, nem refresh token. O objetivo aqui é só demonstrar o
fluxo de cadastro/login com senha em hash e um token de sessão simples
(JWT) que os outros routers conseguem usar pra saber quem está logado.
"""

import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt

from . import models

# Em produção isso TEM que vir de uma variável de ambiente de verdade (e
# nunca ser commitado no repositório). Esse valor default só existe pra
# rodar localmente sem configuração extra durante o hackathon.
SECRET_KEY = os.environ.get(
    "AYVU_SECRET_KEY",
    "dev-secret-so-para-hackathon-troque-via-variavel-de-ambiente-AYVU_SECRET_KEY",
)
ALGORITHM = "HS256"
EXPIRACAO_TOKEN = timedelta(days=7)

# PBKDF2 via stdlib (sem bcrypt/passlib); iterações na mesma ordem do Django.
_ITERACOES_PBKDF2 = 260_000
_HASH_ALGO = "sha256"


def gerar_hash_senha(senha: str) -> str:
    """Gera `salt$hash` (ambos em hex) — nunca guarde a senha em texto puro."""
    salt = os.urandom(16)
    hash_bytes = hashlib.pbkdf2_hmac(_HASH_ALGO, senha.encode("utf-8"), salt, _ITERACOES_PBKDF2)
    return f"{salt.hex()}${hash_bytes.hex()}"


def verificar_senha(senha: str, hash_armazenado: str) -> bool:
    try:
        salt_hex, hash_hex = hash_armazenado.split("$", 1)
        salt = bytes.fromhex(salt_hex)
        hash_esperado = bytes.fromhex(hash_hex)
    except ValueError:
        return False

    hash_calculado = hashlib.pbkdf2_hmac(_HASH_ALGO, senha.encode("utf-8"), salt, _ITERACOES_PBKDF2)
    # comparação em tempo constante — evita vazar informação por timing.
    return hmac.compare_digest(hash_calculado, hash_esperado)


def gerar_token(usuario: "models.Usuario") -> str:
    payload = {
        "user_id": usuario.id,
        "tipo": usuario.tipo.value,
        "nome": usuario.nome,
        "exp": datetime.now(timezone.utc) + EXPIRACAO_TOKEN,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decodificar_token(token: str) -> dict:
    """Levanta jwt.PyJWTError se o token for inválido ou tiver expirado."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
