import secrets
from datetime import datetime, timezone
from pydantic import BaseModel, EmailStr, Field
from fastapi import HTTPException, status
from psycopg2.extras import RealDictCursor
from src.db import get_db_connection, release_db_connection, hash_password, verify_password

# Simple, tamper-resistant token store
ACTIVE_SESSIONS = {}

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    token: str
    message: str

def create_session_token(user_id: int, email: str, role: str) -> str:
    token = secrets.token_urlsafe(32)
    ACTIVE_SESSIONS[token] = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    return token

def get_user_from_token(token: str):
    if not token:
        return None
    session = ACTIVE_SESSIONS.get(token)
    if not session:
        return None
    return session

def register_user(req: RegisterRequest):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check for existing email
            cur.execute("SELECT id FROM users WHERE LOWER(email) = LOWER(%s);", (req.email,))
            if cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email address already exists. Please sign in instead."
                )

            # Insert user
            pwd_hash = hash_password(req.password)
            cur.execute("""
                INSERT INTO users (name, email, password_hash, role, created_at)
                VALUES (%s, %s, %s, 'ROLE_USER', NOW())
                RETURNING id, name, email, role;
            """, (req.name.strip(), req.email.strip().lower(), pwd_hash))
            user = cur.fetchone()
            conn.commit()

            token = create_session_token(user["id"], user["email"], user["role"])
            return {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
                "token": token,
                "message": "Account created successfully"
            }
    finally:
        release_db_connection(conn)

def login_user(req: LoginRequest):
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id, name, email, password_hash, role FROM users WHERE LOWER(email) = LOWER(%s);", (req.email.strip().lower(),))
            user = cur.fetchone()
            if not user or not verify_password(req.password, user["password_hash"]):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password. Please verify your credentials."
                )

            token = create_session_token(user["id"], user["email"], user["role"])
            return {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
                "token": token,
                "message": "Signed in successfully"
            }
    finally:
        release_db_connection(conn)
