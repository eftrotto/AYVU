"""Dependencies do FastAPI pra saber quem está logado (ver security.py)."""

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from . import models, security
from .database import get_db

# auto_error=False pra podermos dar uma mensagem em português quando faltar
# o header Authorization, em vez do erro genérico do FastAPI.
_bearer_scheme = HTTPBearer(auto_error=False)


def get_usuario_atual(
    credenciais: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> models.Usuario:
    if credenciais is None:
        raise HTTPException(status_code=401, detail="Faça login para continuar.")

    try:
        payload = security.decodificar_token(credenciais.credentials)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada. Faça login de novo.")

    usuario = db.get(models.Usuario, payload.get("user_id"))
    if usuario is None:
        raise HTTPException(status_code=401, detail="Usuário não encontrado.")
    return usuario


def exigir_professor(usuario: models.Usuario = Depends(get_usuario_atual)) -> models.Usuario:
    if usuario.tipo != models.TipoUsuario.PROFESSOR:
        raise HTTPException(status_code=403, detail="Só professores podem acessar isso.")
    return usuario


def exigir_aluno(usuario: models.Usuario = Depends(get_usuario_atual)) -> models.Usuario:
    if usuario.tipo != models.TipoUsuario.ALUNO:
        raise HTTPException(status_code=403, detail="Só alunos podem acessar isso.")
    return usuario
