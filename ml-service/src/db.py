import os
import hashlib
import secrets
from datetime import datetime, timezone
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "123456789")
DB_NAME = os.getenv("DB_NAME", "airguard_db")

# Connection pool
pg_pool = None

def get_pool():
    global pg_pool
    if pg_pool is None:
        pg_pool = psycopg2.pool.SimpleConnectionPool(
            minconn=1,
            maxconn=15,
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            dbname=DB_NAME
        )
    return pg_pool

def get_db_connection():
    return get_pool().getconn()

def release_db_connection(conn):
    if pg_pool and conn:
        pg_pool.putconn(conn)

def hash_password(password: str, salt: str = None) -> str:
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return f"{salt}:{hashed}"

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, _ = stored_hash.split(":", 1)
        return hash_password(password, salt) == stored_hash
    except Exception:
        return False

def init_db():
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Create users table if not exists
            cur.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(150) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(50) DEFAULT 'ROLE_USER',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """)

            # Create favorites table if not exists
            cur.execute("""
                CREATE TABLE IF NOT EXISTS favorites (
                    id SERIAL PRIMARY KEY,
                    city_id BIGINT REFERENCES cities(id) ON DELETE CASCADE,
                    user_identifier VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE(city_id, user_identifier)
                );
            """)

            # Seed demo user if not exists
            demo_email = "demo@airguard.ai"
            cur.execute("SELECT id FROM users WHERE email = %s;", (demo_email,))
            if not cur.fetchone():
                demo_hash = hash_password("airguard123")
                cur.execute("""
                    INSERT INTO users (name, email, password_hash, role, created_at)
                    VALUES (%s, %s, %s, %s, NOW());
                """, ("Placement Demo User", demo_email, demo_hash, "ROLE_ADMIN"))

            conn.commit()
    finally:
        release_db_connection(conn)
