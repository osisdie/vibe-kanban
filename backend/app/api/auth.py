from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from authlib.integrations.httpx_client import AsyncOAuth2Client

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_reset_token,
    decode_reset_token,
    get_current_user,
)
from app.core.email import send_password_reset_email, send_welcome_email
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserOut,
    UserUpdate,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    user_count = await db.scalar(select(func.count()).select_from(User))
    role = "super_admin" if user_count == 0 else "user"
    user = User(
        email=req.email,
        hashed_password=hash_password(req.password),
        display_name=req.display_name,
        role=role,
    )
    db.add(user)
    await db.flush()
    await send_welcome_email(user.email, user.display_name)
    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserOut)
async def update_me(
    req: UserUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.display_name is not None:
        user.display_name = req.display_name
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@router.post("/change-password")
async def change_password(
    req: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.hashed_password:
        raise HTTPException(
            status_code=400,
            detail="Account uses Google login. Set a password via forgot-password first.",
        )
    if not verify_password(req.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user.hashed_password = hash_password(req.new_password)
    user.password_changed_at = datetime.now(timezone.utc)
    db.add(user)
    return {"detail": "Password changed successfully"}


@router.post("/forgot-password")
async def forgot_password(
    req: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    # Always return success to prevent email enumeration
    if user:
        token = create_reset_token(user.id)
        await send_password_reset_email(user.email, token)
    return {"detail": "If that email exists, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(
    req: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    user_id = decode_reset_token(req.token)
    if user_id is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user.hashed_password = hash_password(req.new_password)
    user.password_changed_at = datetime.now(timezone.utc)
    db.add(user)
    return {"detail": "Password has been reset. You can now log in."}


@router.get("/google")
async def google_login():
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")
    client = AsyncOAuth2Client(
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        redirect_uri=settings.GOOGLE_REDIRECT_URI,
        scope="openid email profile",
    )
    uri, _ = client.create_authorization_url("https://accounts.google.com/o/oauth2/v2/auth")
    return RedirectResponse(uri)


@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")
    client = AsyncOAuth2Client(
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        redirect_uri=settings.GOOGLE_REDIRECT_URI,
    )
    await client.fetch_token(
        "https://oauth2.googleapis.com/token",
        code=code,
        grant_type="authorization_code",
    )
    resp = await client.get("https://www.googleapis.com/oauth2/v3/userinfo")
    userinfo = resp.json()

    result = await db.execute(select(User).where(User.google_id == userinfo["sub"]))
    user = result.scalar_one_or_none()
    if not user:
        result = await db.execute(select(User).where(User.email == userinfo["email"]))
        user = result.scalar_one_or_none()
        if user:
            user.google_id = userinfo["sub"]
            user.avatar_url = userinfo.get("picture")
        else:
            user_count = await db.scalar(select(func.count()).select_from(User))
            role = "super_admin" if user_count == 0 else "user"
            user = User(
                email=userinfo["email"],
                display_name=userinfo.get("name", userinfo["email"]),
                google_id=userinfo["sub"],
                avatar_url=userinfo.get("picture"),
                role=role,
            )
            db.add(user)
            await db.flush()
            await send_welcome_email(user.email, user.display_name)
    await db.flush()
    jwt_token = create_access_token(user.id)
    return RedirectResponse(f"{settings.FRONTEND_URL}/login?token={jwt_token}")
