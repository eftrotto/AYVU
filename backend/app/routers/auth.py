from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, schemas, security
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/cadastro", response_model=schemas.UsuarioResponse, status_code=201)
def cadastrar(dados: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    ja_existe = db.execute(
        select(models.Usuario).where(models.Usuario.email == dados.email)
    ).scalar_one_or_none()

    if ja_existe is not None:
        raise HTTPException(status_code=409, detail="Já existe uma conta com esse e-mail.")

    usuario = models.Usuario(
        nome=dados.nome,
        email=dados.email,
        senha_hash=security.gerar_hash_senha(dados.senha),
        tipo=dados.tipo,
        oka_id=dados.oka_id,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.post("/login", response_model=schemas.LoginResponse)
def login(dados: schemas.UsuarioLogin, db: Session = Depends(get_db)):
    usuario = db.execute(
        select(models.Usuario).where(models.Usuario.email == dados.email)
    ).scalar_one_or_none()

    # Mesma mensagem genérica pros dois casos (e-mail não cadastrado / senha
    # errada), pra não confirmar pra quem tenta adivinhar se um e-mail
    # existe na base.
    if usuario is None or not security.verificar_senha(dados.senha, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")

    token = security.gerar_token(usuario)
    return schemas.LoginResponse(
        token=token,
        usuario=schemas.UsuarioResponse.model_validate(usuario),
    )
