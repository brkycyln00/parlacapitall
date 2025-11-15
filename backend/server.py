from fastapi import FastAPI, APIRouter, HTTPException, Response, Request, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import secrets
import jwt
import hashlib
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    password_hash: Optional[str] = None
    picture: Optional[str] = None
    referral_code: str = Field(default_factory=lambda: secrets.token_urlsafe(8))
    upline_id: Optional[str] = None
    package: Optional[str] = None  # silver, gold, platinum
    package_amount: float = 0.0
    investment_date: Optional[str] = None
    total_invested: float = 0.0
    weekly_earnings: float = 0.0
    total_commissions: float = 0.0
    # Weekly profit tracking
    weekly_profit_count: int = 0
    total_weekly_profit: float = 0.0
    last_profit_date: Optional[str] = None
    left_child_id: Optional[str] = None
    right_child_id: Optional[str] = None
    position: Optional[str] = None  # left or right
    left_volume: float = 0.0
    right_volume: float = 0.0
    binary_earnings: float = 0.0
    career_level: str = "None"
    career_points: float = 0.0
    career_rewards: float = 0.0
    wallet_balance: float = 0.0
    is_admin: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    last_login: Optional[str] = None
    # Email verification fields
    is_email_verified: bool = False
    verification_token: Optional[str] = None
    verification_token_expires: Optional[str] = None
    # Password change fields
    password_change_token: Optional[str] = None
    password_change_token_expires: Optional[str] = None
    new_password_hash: Optional[str] = None


class ReferralCode(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str = Field(default_factory=lambda: secrets.token_urlsafe(8))
    user_id: str
    position: str = "auto"  # "left", "right", or "auto"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    expires_at: str = Field(default_factory=lambda: (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat())
    is_used: bool = False
    used_by: Optional[str] = None
    used_at: Optional[str] = None

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Investment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    package: str
    amount: float
    investment_date: str
    last_profit_date: Optional[str] = None
    total_earnings: float = 0.0
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class InvestmentRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    full_name: str
    username: str
    email: str
    whatsapp: str
    platform: str  # tether_trc20, ethereum_erc20, iban
    package: str
    amount: float
    status: str = "pending"  # pending, approved, rejected
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class WithdrawalRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    full_name: str
    iban: str
    amount: float
    status: str = "pending"  # pending, approved, rejected
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # deposit, withdrawal, commission, weekly_profit, binary, career_reward
    amount: float
    crypto_type: Optional[str] = None  # usdt, btc, eth, mock
    status: str = "pending"  # pending, completed, rejected
    description: str = ""
    wallet_address: Optional[str] = None
    tx_hash: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PackageInfo(BaseModel):
    name: str
    amount: float
    commission_rate: float
    weekly_profit_rate: float = 0.05

class PlacementHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    old_upline_id: Optional[str] = None
    new_upline_id: str
    old_position: Optional[str] = None  # left, right, or None
    new_position: str  # left or right
    admin_id: str
    admin_name: str
    action_type: str  # "initial_placement" or "repositioning"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PlaceUserRequest(BaseModel):
    user_id: str
    upline_id: str
    position: str  # "left" or "right"

# Career levels configuration
CAREER_LEVELS = [
    {"name": "Amethyst", "left_req": 5000, "right_req": 5000, "reward": 500},
    {"name": "Sapphire", "left_req": 10000, "right_req": 10000, "reward": 1000},
    {"name": "Ruby", "left_req": 20000, "right_req": 20000, "reward": 3000},
    {"name": "Emerald", "left_req": 50000, "right_req": 50000, "reward": 7500},
    {"name": "Diamond", "left_req": 100000, "right_req": 100000, "reward": 20000},
    {"name": "Crown", "left_req": 300000, "right_req": 300000, "reward": "TOGG"}
]

def get_career_level(left_volume: float, right_volume: float):
    """Calculate user's career level based on binary volumes"""
    current_level = None
    next_level = None
    progress = 0
    
    for i, level in enumerate(CAREER_LEVELS):
        if left_volume >= level["left_req"] and right_volume >= level["right_req"]:
            current_level = level
        elif not next_level:
            next_level = level
            # Calculate progress to next level
            left_progress = (left_volume / level["left_req"]) * 100
            right_progress = (right_volume / level["right_req"]) * 100
            progress = min(left_progress, right_progress)  # Limited by weaker leg
            break
    
    return {
        "current_level": current_level["name"] if current_level else "None",
        "current_reward": current_level["reward"] if current_level else 0,
        "next_level": next_level["name"] if next_level else "Crown",
        "next_reward": next_level["reward"] if next_level else "TOGG",
        "left_volume": left_volume,
        "right_volume": right_volume,
        "left_needed": next_level["left_req"] if next_level else 300000,
        "right_needed": next_level["right_req"] if next_level else 300000,
        "progress": round(progress, 2)
    }

# ==================== AUTH HELPERS ====================

async def get_session_token(request: Request) -> Optional[str]:
    # First check cookies
    token = request.cookies.get("session_token")
    if token:
        return token
    
    # Then check Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.replace("Bearer ", "")
    
    return None

async def get_current_user(request: Request) -> Optional[User]:
    # Use JWT-aware function
    return await get_current_user_jwt(request)

async def require_auth(request: Request) -> User:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_admin(request: Request) -> User:
    user = await require_auth(request)
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

class InvestmentRequestCreate(BaseModel):
    full_name: str
    username: str
    email: str
    whatsapp: str
    platform: str
    package: str


class WithdrawalRequestCreate(BaseModel):
    full_name: str
    iban: str
    amount: float


# ==================== JWT AUTH CONFIG ====================

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_DAYS = 7

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr  # Email validation
    password: str
    name: str
    referral_code: Optional[str] = None

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

async def send_welcome_email(user_email: str, user_name: str):
    """Send welcome email to new users via SMTP"""
    try:
        # SMTP configuration from environment variables
        smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_email = os.environ.get('SMTP_EMAIL', '')
        smtp_password = os.environ.get('SMTP_PASSWORD', '')
        
        # Skip if SMTP not configured
        if not smtp_email or not smtp_password:
            logger.warning("SMTP not configured. Skipping welcome email.")
            return False
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "🚀 Parlacapital ile Network Marketing'de Büyük Kazançlar Sizi Bekliyor!"
        msg['From'] = f"Parlacapital <{smtp_email}>"
        msg['To'] = user_email
        
        # Email body
        text = f"""
Merhaba {user_name},

Parlacapital ailesine hoş geldiniz! 🎉 Şimdi network marketing dünyasında inanılmaz fırsatlar kapınızı çalıyor! 💥

Kripto yatırımından daha fazlasını sunuyoruz! Sadece para kazanmakla kalmayacak, aynı zamanda güçlü bir network kurarak gelirlerinizi katlayabileceksiniz. Bu yolculuğun her anı heyecan dolu olacak!

Unutmayın: Network marketing sadece kazanç değil, bir topluluk inşa etme sanatıdır.

Parlacapital ile hem finansal özgürlüğünüzü kazanacak, hem de sizinle aynı hedefe yürüyen güçlü bir ekip kuracaksınız. 🤝

Bugün attığınız küçük bir adım, yarın büyük bir fark yaratabilir.

Şimdi harekete geçin — network'ünüzü büyütün, geleceğinizi şekillendirin! 🌟

Başarı ve bolluk dileklerimizle,
✨ Parlacapital Ekibi
        """
        
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Parlacapital ile Network Marketing'de<br/>Büyük Kazançlar Sizi Bekliyor! 🚀</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #667eea;">Merhaba {user_name},</h2>
              
              <p style="font-size: 16px;">
                <strong>Parlacapital ailesine hoş geldiniz!</strong> 🎉 Şimdi network marketing dünyasında inanılmaz fırsatlar kapınızı çalıyor! 💥
              </p>
              
              <p style="font-size: 16px;">
                Kripto yatırımından daha fazlasını sunuyoruz! Sadece para kazanmakla kalmayacak, aynı zamanda <strong>güçlü bir network kurarak</strong> gelirlerinizi katlayabileceksiniz. Bu yolculuğun her anı heyecan dolu olacak!
              </p>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-style: italic; color: #856404;">
                  <strong>Unutmayın:</strong> Network marketing sadece kazanç değil, bir topluluk inşa etme sanatıdır.
                </p>
              </div>
              
              <p style="font-size: 16px;">
                Parlacapital ile hem finansal özgürlüğünüzü kazanacak, hem de sizinle aynı hedefe yürüyen güçlü bir ekip kuracaksınız. 🤝
              </p>
              
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0;">
                <p style="font-size: 18px; margin: 0; font-weight: bold;">
                  Bugün attığınız küçük bir adım, yarın büyük bir fark yaratabilir.
                </p>
              </div>
              
              <p style="font-size: 16px; text-align: center;">
                <strong>Şimdi harekete geçin — network'ünüzü büyütün, geleceğinizi şekillendirin! 🌟</strong>
              </p>
              
              <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
                <p style="color: #667eea; font-size: 16px; margin: 0;">
                  Başarı ve bolluk dileklerimizle,<br/>
                  <strong>✨ Parlacapital Ekibi</strong>
                </p>
              </div>
            </div>
          </body>
        </html>
        """
        
        part1 = MIMEText(text, 'plain', 'utf-8')
        part2 = MIMEText(html, 'html', 'utf-8')
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email with SSL
        with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
            server.login(smtp_email, smtp_password)
            server.send_message(msg)
        
        logger.info(f"Welcome email sent to {user_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send welcome email to {user_email}: {str(e)}")
        return False

async def send_verification_email(user_email: str, user_name: str, verification_token: str):
    """Send email verification link to new users"""
    try:
        smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_email = os.environ.get('SMTP_EMAIL', '')
        smtp_password = os.environ.get('SMTP_PASSWORD', '')
        
        if not smtp_email or not smtp_password:
            logger.warning("SMTP not configured. Skipping verification email.")
            return False
        
        # Get frontend URL from environment
        frontend_url = os.environ.get('FRONTEND_URL', 'https://parlamoney.preview.emergentagent.com')
        verification_link = f"{frontend_url}/verify-email?token={verification_token}"
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "✅ Email Adresinizi Doğrulayın - Parlacapital"
        msg['From'] = f"Parlacapital <{smtp_email}>"
        msg['To'] = user_email
        
        text = f"""
Merhaba {user_name},

Parlacapital'e hoş geldiniz! 🎉

Email adresinizi doğrulamak için aşağıdaki linke tıklayın:
{verification_link}

Bu link 24 saat geçerlidir.

Email adresinizi doğruladıktan sonra hesabınıza giriş yapabilir ve yatırım yapmaya başlayabilirsiniz.

Saygılarımızla,
Parlacapital Ekibi
        """
        
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Email Adresinizi Doğrulayın ✅</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #667eea;">Merhaba {user_name},</h2>
              
              <p style="font-size: 16px;">
                Parlacapital'e hoş geldiniz! 🎉
              </p>
              
              <p style="font-size: 16px;">
                Hesabınızı aktifleştirmek için email adresinizi doğrulamanız gerekmektedir.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{verification_link}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                  Email Adresimi Doğrula
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666;">
                Eğer butona tıklayamıyorsanız, aşağıdaki linki tarayıcınıza kopyalayın:<br/>
                <a href="{verification_link}" style="color: #667eea; word-break: break-all;">{verification_link}</a>
              </p>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  ⚠️ Bu link 24 saat geçerlidir. Süre sonunda yeni bir doğrulama linki talep etmeniz gerekecektir.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
                <p style="color: #667eea; font-size: 16px; margin: 0;">
                  Saygılarımızla,<br/>
                  <strong>✨ Parlacapital Ekibi</strong>
                </p>
              </div>
            </div>
          </body>
        </html>
        """
        
        part1 = MIMEText(text, 'plain', 'utf-8')
        part2 = MIMEText(html, 'html', 'utf-8')
        msg.attach(part1)
        msg.attach(part2)
        
        with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
            server.login(smtp_email, smtp_password)
            server.send_message(msg)
        
        logger.info(f"Verification email sent to {user_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send verification email to {user_email}: {str(e)}")
        return False

async def send_password_change_email(user_email: str, user_name: str, password_change_token: str):
    """Send password change confirmation email"""
    try:
        smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_email = os.environ.get('SMTP_EMAIL', '')
        smtp_password = os.environ.get('SMTP_PASSWORD', '')
        
        if not smtp_email or not smtp_password:
            logger.warning("SMTP not configured. Skipping password change email.")
            return False
        
        frontend_url = os.environ.get('FRONTEND_URL', 'https://parlamoney.preview.emergentagent.com')
        confirmation_link = f"{frontend_url}/confirm-password-change?token={password_change_token}"
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "🔐 Şifre Değişikliği Onayı - Parlacapital"
        msg['From'] = f"Parlacapital <{smtp_email}>"
        msg['To'] = user_email
        
        text = f"""
Merhaba {user_name},

Hesabınız için şifre değişikliği talebinde bulundunuz.

Şifre değişikliğini onaylamak için aşağıdaki linke tıklayın:
{confirmation_link}

Bu link 24 saat geçerlidir.

Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz. Şifreniz değiştirilmeyecektir.

Saygılarımızla,
Parlacapital Ekibi
        """
        
        html = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Şifre Değişikliği Onayı 🔐</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2 style="color: #667eea;">Merhaba {user_name},</h2>
              
              <p style="font-size: 16px;">
                Hesabınız için şifre değişikliği talebinde bulundunuz.
              </p>
              
              <p style="font-size: 16px;">
                Şifre değişikliğini onaylamak için aşağıdaki butona tıklayın:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{confirmation_link}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                  Şifre Değişikliğini Onayla
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666;">
                Eğer butona tıklayamıyorsanız, aşağıdaki linki tarayıcınıza kopyalayın:<br/>
                <a href="{confirmation_link}" style="color: #667eea; word-break: break-all;">{confirmation_link}</a>
              </p>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  ⚠️ Bu link 24 saat geçerlidir.
                </p>
              </div>
              
              <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #721c24;">
                  🚨 Eğer bu talebi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz. Şifreniz değiştirilmeyecektir.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
                <p style="color: #667eea; font-size: 16px; margin: 0;">
                  Saygılarımızla,<br/>
                  <strong>✨ Parlacapital Ekibi</strong>
                </p>
              </div>
            </div>
          </body>
        </html>
        """
        
        part1 = MIMEText(text, 'plain', 'utf-8')
        part2 = MIMEText(html, 'html', 'utf-8')
        msg.attach(part1)
        msg.attach(part2)
        
        with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
            server.login(smtp_email, smtp_password)
            server.send_message(msg)
        
        logger.info(f"Password change email sent to {user_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send password change email to {user_email}: {str(e)}")
        return False


def create_jwt_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get('user_id')
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def get_current_user_jwt(request: Request) -> Optional[User]:
    # Check for JWT token
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
        user_id = verify_jwt_token(token)
        if user_id:
            user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
            if user_doc:
                return User(**user_doc)
    
    # Fallback to session token
    token = request.cookies.get("session_token")
    if token:
        session_doc = await db.user_sessions.find_one({"session_token": token})
        if session_doc:
            expires_at = session_doc["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            
            if expires_at >= datetime.now(timezone.utc):
                user_doc = await db.users.find_one({"id": session_doc["user_id"]}, {"_id": 0})
                if user_doc:
                    return User(**user_doc)
    
    return None

# ==================== JWT AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register(req: RegisterRequest):
    # Check if user exists
    existing_user = await db.users.find_one({"email": req.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kayıtlı")
    
    upline_user = None
    
    # Validate referral code (OPTIONAL)
    if req.referral_code:
        # Clean the code
        clean_code = req.referral_code.strip()
        
        # Find referral code in referral_codes collection (case-insensitive)
        import re
        referral_doc = await db.referral_codes.find_one({
            "code": {"$regex": f"^{re.escape(clean_code)}$", "$options": "i"}
        }, {"_id": 0})
        
        if not referral_doc:
            raise HTTPException(status_code=400, detail="Geçersiz referans kodu. Lütfen doğru kodu girdiğinizden emin olun.")
        
        referral = ReferralCode(**referral_doc)
        
        # Check if code is expired
        expires_at = datetime.fromisoformat(referral.expires_at)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Bu referans kodunun süresi dolmuş. Lütfen yeni bir kod isteyin.")
        
        # Check if code is already used
        if referral.is_used:
            raise HTTPException(status_code=400, detail="Bu referans kodu daha önce kullanılmış. Her kod sadece bir kez kullanılabilir.")
        
        # Find upline user
        upline = await db.users.find_one({"id": referral.user_id}, {"_id": 0})
        if not upline:
            raise HTTPException(status_code=400, detail="Geçersiz referans kodu.")
        
        upline_user = User(**upline)
    
    # Generate verification token (valid for 24 hours)
    verification_token = secrets.token_urlsafe(32)
    verification_expires = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    
    # Create new user (email not verified yet)
    user = User(
        email=req.email,
        name=req.name,
        password_hash=hash_password(req.password),
        upline_id=upline_user.id if upline_user else None,
        is_email_verified=False,
        verification_token=verification_token,
        verification_token_expires=verification_expires
    )
    
    # NOTE: We do NOT automatically place user in binary tree during registration
    # User will be in "unplaced" state until sponsor manually places them
    # This allows unlimited referrals per sponsor
    
    # Mark referral code as used (if upline exists)
    if upline_user:
        await db.referral_codes.update_one(
            {"id": referral.id},
            {"$set": {
                "is_used": True,
                "used_by": user.id,
                "used_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    user_dict = user.model_dump()
    await db.users.insert_one(user_dict)
    
    # Send verification email
    try:
        await send_verification_email(user.email, user.name, verification_token)
    except Exception as e:
        logger.error(f"Verification email failed but user created: {e}")
    
    # Don't create token yet - user needs to verify email first
    # token = create_jwt_token(user.id)
    
    # Return success message without token
    return {
        "message": "Kaydınız oluşturulmuştur lütfen mail adresinizden doğrulama yapınız (spam klasörünü kontrol edin)",
        "email": user.email,
        "requires_verification": True
    }

@api_router.post("/auth/login")
async def login(req: LoginRequest):
    # Find user
    user_doc = await db.users.find_one({"email": req.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not user_doc.get("password_hash"):
        raise HTTPException(status_code=401, detail="Please use Google login for this account")
    
    if user_doc["password_hash"] != hash_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if email is verified
    if not user_doc.get("is_email_verified", False):
        raise HTTPException(
            status_code=403, 
            detail="Email adresiniz henüz doğrulanmamış. Lütfen email adresinize gönderilen doğrulama linkine tıklayın."
        )
    
    # Create JWT token
    token = create_jwt_token(user_doc["id"])
    
    # Update last login time
    await db.users.update_one(
        {"id": user_doc["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    user = User(**user_doc)
    
    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "referral_code": user.referral_code,
            "is_admin": user.is_admin
        }
    }



@api_router.get("/auth/verify-email/{token}")
async def verify_email(token: str):
    """Verify user email with token"""
    # Find user by verification token
    user_doc = await db.users.find_one({"verification_token": token}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=400, detail="Geçersiz doğrulama linki")
    
    user = User(**user_doc)
    
    # Check if already verified
    if user.is_email_verified:
        raise HTTPException(status_code=400, detail="Email adresi zaten doğrulanmış")
    
    # Check if token expired
    if user.verification_token_expires:
        expires_at = datetime.fromisoformat(user.verification_token_expires)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=400, 
                detail="Doğrulama linkinin süresi dolmuş. Lütfen yeni kayıt yapın."
            )
    
    # Mark email as verified
    await db.users.update_one(
        {"id": user.id},
        {"$set": {
            "is_email_verified": True,
            "verification_token": None,
            "verification_token_expires": None
        }}
    )
    
    # Send welcome email after verification
    try:
        await send_welcome_email(user.email, user.name)
    except Exception as e:
        logger.error(f"Welcome email failed after verification: {e}")
    
    # Create JWT token for auto-login
    jwt_token = create_jwt_token(user.id)
    
    return {
        "message": "Email adresiniz başarıyla doğrulandı! Hoş geldin emaili gönderildi. Şimdi giriş yapabilirsiniz.",
        "token": jwt_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "is_admin": user.is_admin
        }
    }

@api_router.post("/auth/request-password-change")
async def request_password_change(
    old_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user_jwt)
):
    """Request password change - sends email confirmation"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Giriş yapmalısınız")
    
    # Verify old password
    user_doc = await db.users.find_one({"id": current_user.id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    if user_doc["password_hash"] != hash_password(old_password):
        raise HTTPException(status_code=400, detail="Eski şifre hatalı")
    
    # Validate new password
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Yeni şifre en az 6 karakter olmalıdır")
    
    if old_password == new_password:
        raise HTTPException(status_code=400, detail="Yeni şifre eski şifreyle aynı olamaz")
    
    # Generate password change token (valid for 24 hours)
    password_change_token = secrets.token_urlsafe(32)
    password_change_expires = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    new_password_hash = hash_password(new_password)
    
    # Save token and new password hash (pending confirmation)
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "password_change_token": password_change_token,
            "password_change_token_expires": password_change_expires,
            "new_password_hash": new_password_hash
        }}
    )
    
    # Send confirmation email
    try:
        await send_password_change_email(current_user.email, current_user.name, password_change_token)
    except Exception as e:
        logger.error(f"Password change email failed: {e}")
        raise HTTPException(status_code=500, detail="Email gönderilemedi. Lütfen tekrar deneyin.")
    
    return {
        "message": "Email adresinize onay linki gönderildi. Lütfen email'inizi kontrol edin."
    }

@api_router.get("/auth/confirm-password-change/{token}")
async def confirm_password_change(token: str):
    """Confirm password change with email token"""
    # Find user by password change token
    user_doc = await db.users.find_one({"password_change_token": token}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=400, detail="Geçersiz onay linki")
    
    user = User(**user_doc)
    
    # Check if token expired
    if user.password_change_token_expires:
        expires_at = datetime.fromisoformat(user.password_change_token_expires)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=400, 
                detail="Onay linkinin süresi dolmuş. Lütfen şifre değiştirme işlemini tekrar başlatın."
            )
    
    # Check if new password hash exists
    if not user.new_password_hash:
        raise HTTPException(status_code=400, detail="Geçersiz şifre değişikliği talebi")
    
    # Update password
    await db.users.update_one(
        {"id": user.id},
        {"$set": {
            "password_hash": user.new_password_hash,
            "password_change_token": None,
            "password_change_token_expires": None,
            "new_password_hash": None
        }}
    )
    
    return {
        "message": "Şifreniz başarıyla değiştirildi! Yeni şifrenizle giriş yapabilirsiniz."
    }


@api_router.get("/auth/validate-referral/{referral_code}")
async def validate_referral_code(referral_code: str):
    """Validate if a referral code exists and is valid"""
    # Clean the code (trim whitespace)
    clean_code = referral_code.strip()
    
    # Search for code (case-insensitive using regex)
    import re
    referral_doc = await db.referral_codes.find_one({
        "code": {"$regex": f"^{re.escape(clean_code)}$", "$options": "i"}
    }, {"_id": 0})
    
    if not referral_doc:
        return {
            "valid": False,
            "message": "Yanlış referans kodu girdiniz!"
        }
    
    referral = ReferralCode(**referral_doc)
    
    # Check if expired
    expires_at = datetime.fromisoformat(referral.expires_at)
    if expires_at < datetime.now(timezone.utc):
        return {
            "valid": False,
            "message": "Bu kodun süresi dolmuş!"
        }
    
    # Check if already used
    if referral.is_used:
        return {
            "valid": False,
            "message": "Bu kod kullanılmış!"
        }
    
    # Get upline user info
    upline = await db.users.find_one({"id": referral.user_id}, {"_id": 0, "name": 1})
    if not upline:
        return {
            "valid": False,
            "message": "Geçersiz kod!"
        }
    
    return {
        "valid": True,
        "upline_name": upline.get("name", "Unknown")
    }


# ==================== REFERRAL CODE ENDPOINTS ====================

async def ensure_user_has_referral_code(user_id: str) -> str:
    """Ensure user has at least one active referral code, create one if needed"""
    # Check if user has any active (unused and not expired) referral code
    active_code = await db.referral_codes.find_one({
        "user_id": user_id,
        "is_used": False,
        "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
    }, {"_id": 0})
    
    if active_code:
        return active_code["code"]
    
    # Create new referral code
    new_code = ReferralCode(
        user_id=user_id,
        code=secrets.token_urlsafe(8)
    )
    
    code_dict = new_code.model_dump()
    await db.referral_codes.insert_one(code_dict)
    
    return new_code.code

@api_router.post("/referral/generate")
async def generate_referral_code(request: Request, position: str = "auto"):
    """Generate a new referral code for the authenticated user"""
    user = await require_auth(request)
    
    # Validate position
    if position not in ["left", "right", "auto"]:
        raise HTTPException(status_code=400, detail="Position must be 'left', 'right', or 'auto'")
    
    # Create new referral code
    new_code = ReferralCode(
        user_id=user.id,
        code=secrets.token_urlsafe(8),
        position=position
    )
    
    code_dict = new_code.model_dump()
    await db.referral_codes.insert_one(code_dict)
    
    position_text = {
        "left": "Sol Kol",
        "right": "Sağ Kol",
        "auto": "Otomatik"
    }
    
    return {
        "success": True,
        "code": new_code.code,
        "position": position,
        "position_text": position_text.get(position),
        "expires_at": new_code.expires_at,
        "message": f"Yeni referans kodu oluşturuldu! ({position_text.get(position)})"
    }

@api_router.get("/referral/my-codes")
async def get_my_referral_codes(request: Request):
    """Get all used referral codes for the authenticated user"""
    user = await require_auth(request)
    
    # Get all used referral codes
    codes_cursor = db.referral_codes.find(
        {"user_id": user.id, "is_used": True},
        {"_id": 0}
    ).sort("used_at", -1)
    
    codes = await codes_cursor.to_list(length=None)
    
    # Get referral user details for each code
    result = []
    for code_doc in codes:
        code = ReferralCode(**code_doc)
        
        # Get referred user info
        referred_user = await db.users.find_one(
            {"id": code.used_by},
            {"_id": 0, "name": 1, "email": 1, "created_at": 1}
        )
        
        result.append({
            "code": code.code,
            "created_at": code.created_at,
            "used_at": code.used_at,
            "referred_user": {
                "name": referred_user.get("name", "Unknown") if referred_user else "Unknown",
                "email": referred_user.get("email", "") if referred_user else "",
                "joined_at": referred_user.get("created_at", "") if referred_user else ""
            }
        })
    
    return {
        "codes": result,
        "total": len(result)
    }

class JoinNetworkRequest(BaseModel):
    referral_code: str

@api_router.post("/referral/join-network")
async def join_network_with_code(req: JoinNetworkRequest, current_user: User = Depends(require_auth)):
    """
    Allow existing users to join a network by entering a referral code.
    - One-time only (if user already has upline, cannot change)
    - Cannot use own referral codes
    - Code must be valid and not expired
    """
    # Check if user already has an upline
    if current_user.upline_id:
        raise HTTPException(
            status_code=400, 
            detail="Zaten bir sponsor ağına katılmışsınız. Sadece bir kez referans kodu girebilirsiniz."
        )
    
    # Find referral code
    referral_doc = await db.referral_codes.find_one({"code": req.referral_code}, {"_id": 0})
    if not referral_doc:
        raise HTTPException(status_code=400, detail="Geçersiz referans kodu.")
    
    referral = ReferralCode(**referral_doc)
    
    # Check if user is trying to use their own code
    if referral.user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Kendi referans kodunuzu kullanamazsınız."
        )
    
    # Check if code is expired
    expires_at = datetime.fromisoformat(referral.expires_at)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=400, 
            detail="Bu referans kodunun süresi dolmuş. Lütfen yeni bir kod isteyin."
        )
    
    # Check if code is already used
    if referral.is_used:
        raise HTTPException(
            status_code=400, 
            detail="Bu referans kodu daha önce kullanılmış. Her kod sadece bir kez kullanılabilir."
        )
    
    # Get sponsor user
    sponsor_doc = await db.users.find_one({"id": referral.user_id}, {"_id": 0})
    if not sponsor_doc:
        raise HTTPException(status_code=400, detail="Sponsor bulunamadı.")
    
    sponsor = User(**sponsor_doc)
    
    # Update current user's upline_id (but DON'T place in binary tree yet)
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"upline_id": sponsor.id}}
    )
    
    # Mark referral code as used
    await db.referral_codes.update_one(
        {"id": referral.id},
        {"$set": {
            "is_used": True,
            "used_by": current_user.id,
            "used_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "message": f"Başarılı! {sponsor.name} ağına katıldınız.",
        "sponsor_name": sponsor.name,
        "sponsor_email": sponsor.email,
        "note": "Sponsor sizi binary ağaçta istediği konuma yerleştirecektir."
    }

# ==================== GOOGLE AUTH ENDPOINTS ====================

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent Auth API
    async with httpx.AsyncClient() as client:
        try:
            auth_response = await client.get(
                os.environ.get('AUTH_SERVICE_URL', 'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data'),
                headers={"X-Session-ID": session_id}
            )
            auth_response.raise_for_status()
            auth_data = auth_response.json()
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
    
    if existing_user:
        user = User(**existing_user)
    else:
        # Create new user
        user = User(
            id=auth_data["id"],
            email=auth_data["email"],
            name=auth_data["name"],
            picture=auth_data.get("picture")
        )
        user_dict = user.model_dump()
        await db.users.insert_one(user_dict)
    
    # Create session
    session_token = auth_data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session = UserSession(
        user_id=user.id,
        session_token=session_token,
        expires_at=expires_at
    )
    
    session_dict = session.model_dump()
    session_dict["expires_at"] = session_dict["expires_at"].isoformat()
    session_dict["created_at"] = session_dict["created_at"].isoformat()
    
    await db.user_sessions.insert_one(session_dict)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7*24*60*60,
        path="/"
    )
    
    return {"user": user.model_dump(), "session_token": session_token}

@api_router.get("/auth/me")
async def get_me(user: User = Depends(require_auth)):
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = await get_session_token(request)
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== PACKAGE ENDPOINTS ====================

PACKAGES = {
    "silver": PackageInfo(name="Silver", amount=250.0, commission_rate=0.05),
    "gold": PackageInfo(name="Gold", amount=500.0, commission_rate=0.10),
    "platinum": PackageInfo(name="Platinum", amount=1000.0, commission_rate=0.15)
}

@api_router.get("/packages")
async def get_packages():
    return list(PACKAGES.values())


@api_router.post("/investment/request")
async def create_investment_request(
    req: InvestmentRequestCreate,
    user: User = Depends(require_auth)
):
    # Check if user already has an approved investment
    existing_approved = await db.investment_requests.find_one({
        "user_id": user.id,
        "status": "approved"
    })
    
    if existing_approved:
        raise HTTPException(
            status_code=400,
            detail="Zaten onaylanmış bir yatırımınız var. Sadece bir kez yatırım yapabilirsiniz."
        )
    
    if req.package not in PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    package_info = PACKAGES[req.package]
    
    # Create investment request
    request = InvestmentRequest(
        user_id=user.id,
        full_name=req.full_name,
        username=req.username,
        email=req.email,
        whatsapp=req.whatsapp,
        platform=req.platform,
        package=req.package,
        amount=package_info.amount
    )
    
    await db.investment_requests.insert_one(request.model_dump())
    
    return {
        "success": True,
        "message": "Yatırım talebiniz alındı! Admin onayından sonra hesabınıza yansıyacaktır.",
        "request_id": request.id
    }


@api_router.get("/investment/my-requests")
async def get_my_investment_requests(user: User = Depends(require_auth)):
    """Get current user's investment requests"""
    requests = await db.investment_requests.find(
        {"user_id": user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"requests": requests}

@api_router.get("/admin/investment-requests")
async def get_investment_requests(user: User = Depends(require_admin)):
    requests = await db.investment_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"requests": requests}

@api_router.get("/admin/approved-investments")
async def get_approved_investments(user: User = Depends(require_admin)):
    """Get all approved investments with user details"""
    approved_requests = await db.investment_requests.find(
        {"status": "approved"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    
    # Enrich with user data
    result = []
    for req in approved_requests:
        user_doc = await db.users.find_one({"id": req["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        result.append({
            **req,
            "user_name": user_doc.get("name") if user_doc else "Unknown",
            "user_email": user_doc.get("email") if user_doc else "Unknown"
        })
    
    return {"approved_investments": result}

@api_router.get("/admin/pending-count")
async def get_pending_count(user: User = Depends(require_admin)):
    """Get count of pending investment requests"""
    count = await db.investment_requests.count_documents({"status": "pending"})
    return {"pending_count": count}

@api_router.post("/admin/investment-requests/{request_id}/approve")
async def approve_investment_request(request_id: str, user: User = Depends(require_admin)):
    request_doc = await db.investment_requests.find_one({"id": request_id}, {"_id": 0})
    if not request_doc:
        raise HTTPException(status_code=404, detail="Request not found")
    
    request = InvestmentRequest(**request_doc)
    
    # Get user
    user_doc = await db.users.find_one({"id": request.user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    target_user = User(**user_doc)
    
    # Create actual investment
    investment = Investment(
        user_id=target_user.id,
        package=request.package,
        amount=request.amount,
        investment_date=datetime.now(timezone.utc).isoformat()
    )
    
    await db.investments.insert_one(investment.model_dump())
    
    # Update user (wallet_balance is NOT increased with investment amount, only with profits)
    await db.users.update_one(
        {"id": target_user.id},
        {
            "$set": {
                "package": request.package,
                "package_amount": request.amount,
                "investment_date": investment.investment_date
            },
            "$inc": {
                "total_invested": request.amount
            }
        }
    )
    
    # Calculate and add commission to direct upline ONLY (single level)
    if target_user.upline_id:
        # Get commission rate based on package
        commission_rates = {
            "silver": 0.05,   # 5%
            "gold": 0.10,     # 10%
            "platinum": 0.15  # 15%
        }
        
        commission_rate = commission_rates.get(request.package, 0)
        commission_amount = request.amount * commission_rate
        
        # Update direct upline's total commissions and wallet balance
        await db.users.update_one(
            {"id": target_user.upline_id},
            {"$inc": {
                "total_commissions": commission_amount,
                "wallet_balance": commission_amount
            }}
        )
        
        # Create commission transaction for direct upline only
        commission_transaction = Transaction(
            user_id=target_user.upline_id,
            type="commission",
            amount=commission_amount,
            status="completed",
            description=f"Direkt komisyon - {target_user.name} ({request.package.upper()} paketi)"
        )
        await db.transactions.insert_one(commission_transaction.model_dump())
        
        # Update volumes up the binary tree and check for binary earnings
        await update_volumes_upline(target_user.id, request.amount)
    
    # Mark request as approved
    await db.investment_requests.update_one(
        {"id": request_id},
        {"$set": {"status": "approved"}}
    )
    
    return {"success": True, "message": "Investment approved"}



# ==================== WITHDRAWAL ENDPOINTS ====================

@api_router.post("/withdrawal/request")
async def create_withdrawal_request(
    req: WithdrawalRequestCreate,
    user: User = Depends(require_auth)
):
    # Calculate available balance (weekly_earnings + total_commissions)
    available_balance = user.weekly_earnings + user.total_commissions
    
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Çekim tutarı 0'dan büyük olmalıdır")
    
    if req.amount > available_balance:
        raise HTTPException(
            status_code=400, 
            detail=f"Yetersiz bakiye. Kullanılabilir bakiye: ${available_balance:.2f}"
        )
    
    # Create withdrawal request
    withdrawal = WithdrawalRequest(
        user_id=user.id,
        full_name=req.full_name,
        iban=req.iban,
        amount=req.amount
    )
    
    await db.withdrawal_requests.insert_one(withdrawal.model_dump())
    
    return {
        "success": True,
        "message": "Çekim talebiniz alınmıştır.",
        "request_id": withdrawal.id
    }

@api_router.get("/withdrawal/my-requests")
async def get_my_withdrawal_requests(user: User = Depends(require_auth)):
    """Get current user's withdrawal requests"""
    requests = await db.withdrawal_requests.find(
        {"user_id": user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"requests": requests}

@api_router.get("/admin/withdrawal-requests")
async def get_withdrawal_requests(user: User = Depends(require_admin)):
    """Get all withdrawal requests for admin"""
    requests = await db.withdrawal_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Get user info for each request
    result = []
    for req_doc in requests:
        req = WithdrawalRequest(**req_doc)
        user_doc = await db.users.find_one({"id": req.user_id}, {"_id": 0, "name": 1, "email": 1})
        result.append({
            **req_doc,
            "user_name": user_doc.get("name") if user_doc else "Unknown",
            "user_email": user_doc.get("email") if user_doc else ""
        })
    
    return {"requests": result}

@api_router.post("/admin/withdrawal-requests/{request_id}/approve")
async def approve_withdrawal_request(request_id: str, user: User = Depends(require_admin)):
    """Approve withdrawal request and deduct from user balance"""
    request_doc = await db.withdrawal_requests.find_one({"id": request_id}, {"_id": 0})
    if not request_doc:
        raise HTTPException(status_code=404, detail="Request not found")
    
    withdrawal = WithdrawalRequest(**request_doc)
    
    if withdrawal.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    
    # Get user
    user_doc = await db.users.find_one({"id": withdrawal.user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    target_user = User(**user_doc)
    
    # Check available balance
    available_balance = target_user.weekly_earnings + target_user.total_commissions
    
    if withdrawal.amount > available_balance:
        raise HTTPException(status_code=400, detail="User has insufficient balance")
    
    # Deduct from weekly_earnings first, then from commissions
    remaining_amount = withdrawal.amount
    new_weekly_earnings = target_user.weekly_earnings
    new_commissions = target_user.total_commissions
    
    if remaining_amount <= new_weekly_earnings:
        new_weekly_earnings -= remaining_amount
    else:
        remaining_amount -= new_weekly_earnings
        new_weekly_earnings = 0
        new_commissions -= remaining_amount
    
    # Update user balance
    await db.users.update_one(
        {"id": target_user.id},
        {"$set": {
            "weekly_earnings": new_weekly_earnings,
            "total_commissions": new_commissions
        }}
    )
    
    # Mark request as approved
    await db.withdrawal_requests.update_one(
        {"id": request_id},
        {"$set": {"status": "approved"}}
    )
    
    # Create transaction record
    transaction = Transaction(
        user_id=target_user.id,
        type="withdrawal",
        amount=withdrawal.amount,
        status="completed",
        description=f"IBAN: {withdrawal.iban}"
    )
    await db.transactions.insert_one(transaction.model_dump())
    
    return {"success": True, "message": "Withdrawal approved"}


@api_router.post("/admin/withdrawal-requests/{request_id}/reject")
async def reject_withdrawal_request(request_id: str, user: User = Depends(require_admin)):
    """Reject withdrawal request"""
    request_doc = await db.withdrawal_requests.find_one({"id": request_id}, {"_id": 0})
    if not request_doc:
        raise HTTPException(status_code=404, detail="Request not found")
    
    withdrawal = WithdrawalRequest(**request_doc)
    
    if withdrawal.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    
    # Mark request as rejected
    await db.withdrawal_requests.update_one(
        {"id": request_id},
        {"$set": {"status": "rejected"}}
    )
    
    return {"success": True, "message": "Withdrawal request rejected"}


@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, admin: User = Depends(require_admin)):
    """Delete a user (admin only)"""
    # Don't allow deleting admin users
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_doc.get("is_admin"):
        raise HTTPException(status_code=400, detail="Cannot delete admin users")
    
    # Delete user
    await db.users.delete_one({"id": user_id})
    
    # Delete related data
    await db.investments.delete_many({"user_id": user_id})
    await db.investment_requests.delete_many({"user_id": user_id})
    await db.withdrawal_requests.delete_many({"user_id": user_id})
    await db.transactions.delete_many({"user_id": user_id})
    await db.referral_codes.delete_many({"user_id": user_id})
    
    return {"success": True, "message": "User deleted"}


@api_router.post("/investments/create")
async def create_investment(
    package: str,
    crypto_type: str,
    referral_code: Optional[str] = None,
    user: User = Depends(require_auth)
):
    if package not in PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    package_info = PACKAGES[package]
    
    # Create investment
    investment = Investment(
        user_id=user.id,
        package=package,
        amount=package_info.amount,
        investment_date=datetime.now(timezone.utc).isoformat()
    )
    
    await db.investments.insert_one(investment.model_dump())
    
    # Update user
    update_data = {
        "package": package,
        "package_amount": package_info.amount,
        "investment_date": investment.investment_date,
        "total_invested": user.total_invested + package_info.amount
    }
    
    # Handle referral
    if referral_code and not user.upline_id:
        upline = await db.users.find_one({"referral_code": referral_code}, {"_id": 0})
        if upline:
            upline_user = User(**upline)
            update_data["upline_id"] = upline_user.id
            
            # Place in binary tree
            if not upline_user.left_child_id:
                await db.users.update_one(
                    {"id": upline_user.id},
                    {"$set": {"left_child_id": user.id}}
                )
                update_data["position"] = "left"
            elif not upline_user.right_child_id:
                await db.users.update_one(
                    {"id": upline_user.id},
                    {"$set": {"right_child_id": user.id}}
                )
                update_data["position"] = "right"
            
            # Update volumes up the tree
            await update_volumes_upline(upline_user.id, package_info.amount)
            
            # Pay commission to upline
            commission = package_info.amount * package_info.commission_rate
            await db.users.update_one(
                {"id": upline_user.id},
                {"$inc": {
                    "total_commissions": commission,
                    "wallet_balance": commission,
                    "career_points": package_info.amount
                }}
            )
            
            # Create commission transaction
            commission_tx = Transaction(
                user_id=upline_user.id,
                type="commission",
                amount=commission,
                status="completed",
                description=f"Referral commission from {user.name}"
            )
            await db.transactions.insert_one(commission_tx.model_dump())
    
    await db.users.update_one({"id": user.id}, {"$set": update_data})
    
    # Create deposit transaction
    tx = Transaction(
        user_id=user.id,
        type="deposit",
        amount=package_info.amount,
        crypto_type=crypto_type,
        status="completed",
        description=f"{package.capitalize()} package purchase"
    )
    await db.transactions.insert_one(tx.model_dump())
    
    return {"message": "Investment created successfully", "investment": investment.model_dump()}

async def update_volumes_upline(user_id: str, amount: float):
    """Update left/right volumes up the tree and check for binary earnings"""
    current_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not current_user:
        return
    
    current = User(**current_user)
    
    # Update volume based on position
    if current.position == "left":
        await db.users.update_one(
            {"id": current.upline_id},
            {"$inc": {"left_volume": amount}}
        )
    elif current.position == "right":
        await db.users.update_one(
            {"id": current.upline_id},
            {"$inc": {"right_volume": amount}}
        )
    
    # Check binary earnings (need $1000 + $1000 on both sides)
    if current.upline_id:
        upline = await db.users.find_one({"id": current.upline_id}, {"_id": 0})
        if upline:
            upline_user = User(**upline)
            if upline_user.left_volume >= 1000 and upline_user.right_volume >= 1000:
                # Calculate binary earnings
                lesser_volume = min(upline_user.left_volume, upline_user.right_volume)
                binary_earnings = (lesser_volume // 1000) * 100
                
                if binary_earnings > upline_user.binary_earnings:
                    new_earnings = binary_earnings - upline_user.binary_earnings
                    await db.users.update_one(
                        {"id": upline_user.id},
                        {"$set": {"binary_earnings": binary_earnings},
                         "$inc": {"wallet_balance": new_earnings}}
                    )
                    
                    # Create transaction
                    binary_tx = Transaction(
                        user_id=upline_user.id,
                        type="binary",
                        amount=new_earnings,
                        status="completed",
                        description="Binary earnings"
                    )
                    await db.transactions.insert_one(binary_tx.model_dump())
            
            # Continue up the tree (max 11 levels)
            await update_volumes_upline(upline_user.id, amount)

# ==================== USER DASHBOARD ====================

@api_router.get("/dashboard")
async def get_dashboard(user: User = Depends(require_auth)):
    # Ensure user has an active referral code (skip for admin)
    active_code = ""
    if not user.is_admin:
        active_code = await ensure_user_has_referral_code(user.id)
    
    # Get direct referrals
    referrals = await db.users.find({"upline_id": user.id}, {"_id": 0}).to_list(100)
    
    # Get active investment
    investment = await db.investments.find_one(
        {"user_id": user.id, "is_active": True},
        {"_id": 0}
    )
    
    # Get recent transactions
    transactions = await db.transactions.find(
        {"user_id": user.id},
        {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    
    # Get left and right children
    left_child = None
    right_child = None
    
    if user.left_child_id:
        left_doc = await db.users.find_one({"id": user.left_child_id}, {"_id": 0})
        if left_doc:
            left_child = {"name": left_doc["name"], "package": left_doc.get("package")}
    
    if user.right_child_id:
        right_doc = await db.users.find_one({"id": user.right_child_id}, {"_id": 0})
        if right_doc:
            right_child = {"name": right_doc["name"], "package": right_doc.get("package")}
    
    # Calculate career level
    career_info = get_career_level(user.left_volume, user.right_volume)
    
    return {
        "user": user.model_dump(),
        "active_referral_code": active_code,
        "referrals": referrals,
        "investment": investment,
        "transactions": transactions,
        "network": {
            "left": left_child,
            "right": right_child
        },
        "career": career_info
    }

@api_router.get("/network/tree")
async def get_network_tree(user: User = Depends(require_auth)):
    async def build_tree(user_id: str, depth: int = 0, max_depth: int = 100):
        # Allow up to 100 levels (virtually unlimited for practical purposes)
        if depth >= max_depth:
            return None
        
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            return None
        
        # Calculate total volume under this node (left + right subtrees)
        async def calculate_subtree_volume(uid: str):
            u = await db.users.find_one({"id": uid}, {"_id": 0})
            if not u:
                return 0
            return u.get("left_volume", 0) + u.get("right_volume", 0) + u.get("total_invested", 0)
        
        node = {
            "id": user_doc["id"],
            "name": user_doc["name"],
            "email": user_doc.get("email", ""),
            "package": user_doc.get("package"),
            "total_invested": user_doc.get("total_invested", 0),
            "left_volume": user_doc.get("left_volume", 0),
            "right_volume": user_doc.get("right_volume", 0),
            "position": user_doc.get("position"),
            "left": None,
            "right": None,
            "depth": depth
        }
        
        if user_doc.get("left_child_id"):
            node["left"] = await build_tree(user_doc["left_child_id"], depth + 1, max_depth)
        
        if user_doc.get("right_child_id"):
            node["right"] = await build_tree(user_doc["right_child_id"], depth + 1, max_depth)
        
        return node
    
    tree = await build_tree(user.id)
    return tree

# ==================== WITHDRAWAL REQUESTS ====================

@api_router.post("/withdrawal/request")
async def request_withdrawal(
    amount: float,
    crypto_type: str,
    wallet_address: str,
    user: User = Depends(require_auth)
):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    
    if user.wallet_balance < amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    
    # Create withdrawal transaction
    tx = Transaction(
        user_id=user.id,
        type="withdrawal",
        amount=amount,
        crypto_type=crypto_type,
        status="pending",
        wallet_address=wallet_address,
        description="Withdrawal request"
    )
    
    await db.transactions.insert_one(tx.model_dump())
    
    # Deduct from wallet
    await db.users.update_one(
        {"id": user.id},
        {"$inc": {"wallet_balance": -amount}}
    )
    
    return {"message": "Withdrawal request submitted", "transaction": tx.model_dump()}

# ==================== ADMIN ENDPOINTS ====================

@api_router.get("/admin/users")
async def admin_get_users(admin: User = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return users

@api_router.get("/admin/transactions")
async def admin_get_transactions(admin: User = Depends(require_admin)):
    transactions = await db.transactions.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).limit(100).to_list(100)
    return transactions

@api_router.post("/admin/transactions/{tx_id}/approve")
async def admin_approve_transaction(
    tx_id: str,
    tx_hash: Optional[str] = None,
    admin: User = Depends(require_admin)
):
    tx = await db.transactions.find_one({"id": tx_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    update_data = {"status": "completed"}
    if tx_hash:
        update_data["tx_hash"] = tx_hash
    
    await db.transactions.update_one({"id": tx_id}, {"$set": update_data})
    
    # If it's a deposit, update user balance
    if tx["type"] == "deposit":
        await db.users.update_one(
            {"id": tx["user_id"]},
            {"$inc": {"wallet_balance": tx["amount"]}}
        )
    
    return {"message": "Transaction approved"}

@api_router.post("/admin/distribute-profit")
async def admin_distribute_profit(
    user_id: str,
    amount: float,
    description: str = "Haftalık kar payı",
    admin: User = Depends(require_admin)
):
    """Admin distributes profit to a specific user"""
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Kar miktarı 0'dan büyük olmalıdır")
    
    # Check if user exists
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    # Create transaction record
    from datetime import datetime, timezone
    transaction = Transaction(
        user_id=user_id,
        type="profit",
        amount=amount,
        status="completed",
        description=description,
        created_at=datetime.now(timezone.utc).isoformat()
    )
    
    await db.transactions.insert_one(transaction.model_dump())
    
    # Update user balance and weekly profit tracking
    await db.users.update_one(
        {"id": user_id},
        {
            "$inc": {
                "wallet_balance": amount,
                "weekly_profit_count": 1,
                "total_weekly_profit": amount
            },
            "$set": {
                "last_profit_date": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {
        "message": f"{amount} TL kar {user['name']} kullanıcısına dağıtıldı",
        "transaction_id": transaction.id,
        "week_number": (user.get('weekly_profit_count', 0) + 1)
    }


@api_router.post("/admin/transactions/{tx_id}/reject")
async def admin_reject_transaction(tx_id: str, admin: User = Depends(require_admin)):
    tx = await db.transactions.find_one({"id": tx_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    await db.transactions.update_one({"id": tx_id}, {"$set": {"status": "rejected"}})
    
    # If withdrawal was rejected, refund to wallet
    if tx["type"] == "withdrawal":
        await db.users.update_one(
            {"id": tx["user_id"]},
            {"$inc": {"wallet_balance": tx["amount"]}}
        )
    
    return {"message": "Transaction rejected"}

@api_router.post("/admin/weekly-profit/distribute")
async def admin_distribute_weekly_profit(admin: User = Depends(require_admin)):
    """Distribute 5% weekly profit to all active investors"""
    investments = await db.investments.find({"is_active": True}, {"_id": 0}).to_list(10000)
    
    distributed_count = 0
    total_distributed = 0.0
    
    for inv_doc in investments:
        inv = Investment(**inv_doc)
        profit = inv.amount * 0.05  # 5% weekly profit
        
        # Update user
        await db.users.update_one(
            {"id": inv.user_id},
            {"$inc": {
                "weekly_earnings": profit,
                "wallet_balance": profit
            }}
        )
        
        # Update investment
        await db.investments.update_one(
            {"id": inv.id},
            {"$set": {"last_profit_date": datetime.now(timezone.utc).isoformat()},
             "$inc": {"total_earnings": profit}}
        )
        
        # Create transaction
        tx = Transaction(
            user_id=inv.user_id,
            type="weekly_profit",
            amount=profit,
            status="completed",
            description=f"Weekly 5% profit on {inv.package} package"
        )
        await db.transactions.insert_one(tx.model_dump())
        
        distributed_count += 1
        total_distributed += profit
    
    return {
        "message": "Weekly profit distributed",
        "distributed_to": distributed_count,
        "total_amount": total_distributed
    }

@api_router.post("/admin/users/{user_id}/make-admin")
async def make_user_admin(user_id: str, admin: User = Depends(require_admin)):
    await db.users.update_one({"id": user_id}, {"$set": {"is_admin": True}})
    return {"message": "User is now an admin"}

@api_router.post("/users/place-referral")
async def user_place_referral(req: PlaceUserRequest, current_user: User = Depends(require_auth)):
    """
    Users can place their own referrals in their binary tree.
    Only allows placing users who were referred by them.
    """
    # Validate position
    if req.position not in ["left", "right"]:
        raise HTTPException(status_code=400, detail="Pozisyon 'left' veya 'right' olmalıdır")
    
    # Get target user
    target_user_doc = await db.users.find_one({"id": req.user_id}, {"_id": 0})
    if not target_user_doc:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    target_user = User(**target_user_doc)
    
    # Get upline user (must be current user)
    upline_doc = await db.users.find_one({"id": req.upline_id}, {"_id": 0})
    if not upline_doc:
        raise HTTPException(status_code=404, detail="Üst sponsor bulunamadı")
    upline = User(**upline_doc)
    
    # Security: User can only place under themselves or their downline
    if req.upline_id != current_user.id:
        # Check if upline is in current user's downline
        is_in_downline = await check_if_in_downline(current_user.id, req.upline_id)
        if not is_in_downline:
            raise HTTPException(status_code=403, detail="Bu kullanıcıyı sadece kendi ağınızdaki üyelerin altına yerleştirebilirsiniz")
    
    # Check if target user is a referral of current user (directly or indirectly)
    # For now, we allow any placement within their network
    
    # Check if position is available
    if req.position == "left" and upline.left_child_id and upline.left_child_id != req.user_id:
        raise HTTPException(status_code=400, detail="Sol kol dolu. Lütfen önce o kullanıcıyı taşıyın.")
    if req.position == "right" and upline.right_child_id and upline.right_child_id != req.user_id:
        raise HTTPException(status_code=400, detail="Sağ kol dolu. Lütfen önce o kullanıcıyı taşıyın.")
    
    # Store old placement info
    old_upline_id = target_user.upline_id
    old_position = target_user.position
    action_type = "repositioning" if old_upline_id else "initial_placement"
    
    # Remove from old position if exists
    if old_upline_id:
        old_upline_doc = await db.users.find_one({"id": old_upline_id}, {"_id": 0})
        if old_upline_doc:
            if old_position == "left":
                await db.users.update_one(
                    {"id": old_upline_id},
                    {"$set": {"left_child_id": None}}
                )
            elif old_position == "right":
                await db.users.update_one(
                    {"id": old_upline_id},
                    {"$set": {"right_child_id": None}}
                )
    
    # Place in new position
    if req.position == "left":
        await db.users.update_one(
            {"id": req.upline_id},
            {"$set": {"left_child_id": req.user_id}}
        )
    else:
        await db.users.update_one(
            {"id": req.upline_id},
            {"$set": {"right_child_id": req.user_id}}
        )
    
    # Update target user
    await db.users.update_one(
        {"id": req.user_id},
        {"$set": {
            "upline_id": req.upline_id,
            "position": req.position
        }}
    )
    
    # Record placement history
    history = PlacementHistory(
        user_id=req.user_id,
        old_upline_id=old_upline_id,
        new_upline_id=req.upline_id,
        old_position=old_position,
        new_position=req.position,
        admin_id=current_user.id,
        admin_name=current_user.name,
        action_type=action_type
    )
    await db.placement_history.insert_one(history.model_dump())
    
    # If user has investments, recalculate volumes
    if target_user.total_invested > 0:
        # Remove volumes from old upline tree
        if old_upline_id:
            await recalculate_volumes_after_removal(old_upline_id, target_user.total_invested)
        
        # Add volumes to new upline tree
        await update_volumes_upline(req.user_id, target_user.total_invested)
    
    return {
        "message": "Kullanıcı başarıyla yerleştirildi",
        "action": action_type,
        "user_name": target_user.name,
        "upline_name": upline.name,
        "position": req.position
    }

async def check_if_in_downline(root_user_id: str, target_user_id: str, max_depth: int = 20) -> bool:
    """Check if target_user is in the downline of root_user"""
    if root_user_id == target_user_id:
        return True
    
    visited = set()
    queue = [root_user_id]
    depth = 0
    
    while queue and depth < max_depth:
        current_level_size = len(queue)
        for _ in range(current_level_size):
            current_id = queue.pop(0)
            if current_id in visited:
                continue
            visited.add(current_id)
            
            if current_id == target_user_id:
                return True
            
            user_doc = await db.users.find_one({"id": current_id}, {"_id": 0, "left_child_id": 1, "right_child_id": 1})
            if user_doc:
                if user_doc.get("left_child_id"):
                    queue.append(user_doc["left_child_id"])
                if user_doc.get("right_child_id"):
                    queue.append(user_doc["right_child_id"])
        depth += 1
    
    return False

@api_router.get("/users/my-referrals")
async def get_my_referrals(current_user: User = Depends(require_auth)):
    """Get all users in current user's network"""
    all_referrals = []
    
    async def collect_referrals(user_id: str, depth: int = 0, max_depth: int = 20):
        if depth >= max_depth:
            return
        
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            return
        
        user = User(**user_doc)
        
        # Add left child
        if user.left_child_id:
            child_doc = await db.users.find_one({"id": user.left_child_id}, {"_id": 0})
            if child_doc:
                all_referrals.append({
                    **child_doc,
                    "depth": depth + 1,
                    "parent_id": user_id,
                    "current_position": "left"
                })
                await collect_referrals(user.left_child_id, depth + 1, max_depth)
        
        # Add right child
        if user.right_child_id:
            child_doc = await db.users.find_one({"id": user.right_child_id}, {"_id": 0})
            if child_doc:
                all_referrals.append({
                    **child_doc,
                    "depth": depth + 1,
                    "parent_id": user_id,
                    "current_position": "right"
                })
                await collect_referrals(user.right_child_id, depth + 1, max_depth)
    
    await collect_referrals(current_user.id)
    
    # Also get unplaced referrals (users who used current user's referral codes but not yet placed)
    referral_codes = await db.referral_codes.find(
        {"user_id": current_user.id, "is_used": True},
        {"_id": 0, "used_by": 1}
    ).to_list(1000)
    
    used_by_ids = [rc.get("used_by") for rc in referral_codes if rc.get("used_by")]
    placed_ids = [ref["id"] for ref in all_referrals]
    
    unplaced_referrals = []
    for user_id in used_by_ids:
        if user_id not in placed_ids:
            user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
            if user_doc:
                unplaced_referrals.append({
                    **user_doc,
                    "depth": 0,
                    "parent_id": None,
                    "current_position": "unplaced"
                })
    
    return {
        "placed": all_referrals,
        "unplaced": unplaced_referrals,
        "total": len(all_referrals) + len(unplaced_referrals)
    }

@api_router.post("/admin/place-user")
async def admin_place_user(req: PlaceUserRequest, admin: User = Depends(require_admin)):
    """
    Admin can manually place any user under any upline in left or right position.
    This also handles repositioning (moving users from one position to another).
    """
    # Validate position
    if req.position not in ["left", "right"]:
        raise HTTPException(status_code=400, detail="Pozisyon 'left' veya 'right' olmalıdır")
    
    # Get target user
    target_user_doc = await db.users.find_one({"id": req.user_id}, {"_id": 0})
    if not target_user_doc:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    target_user = User(**target_user_doc)
    
    # Get upline user
    upline_doc = await db.users.find_one({"id": req.upline_id}, {"_id": 0})
    if not upline_doc:
        raise HTTPException(status_code=404, detail="Üst sponsor bulunamadı")
    upline = User(**upline_doc)
    
    # Check if position is available
    if req.position == "left" and upline.left_child_id and upline.left_child_id != req.user_id:
        raise HTTPException(status_code=400, detail="Sol kol dolu. Lütfen önce o kullanıcıyı taşıyın.")
    if req.position == "right" and upline.right_child_id and upline.right_child_id != req.user_id:
        raise HTTPException(status_code=400, detail="Sağ kol dolu. Lütfen önce o kullanıcıyı taşıyın.")
    
    # Store old placement info
    old_upline_id = target_user.upline_id
    old_position = target_user.position
    action_type = "repositioning" if old_upline_id else "initial_placement"
    
    # Remove from old position if exists
    if old_upline_id:
        old_upline_doc = await db.users.find_one({"id": old_upline_id}, {"_id": 0})
        if old_upline_doc:
            if old_position == "left":
                await db.users.update_one(
                    {"id": old_upline_id},
                    {"$set": {"left_child_id": None}}
                )
            elif old_position == "right":
                await db.users.update_one(
                    {"id": old_upline_id},
                    {"$set": {"right_child_id": None}}
                )
    
    # Place in new position
    if req.position == "left":
        await db.users.update_one(
            {"id": req.upline_id},
            {"$set": {"left_child_id": req.user_id}}
        )
    else:
        await db.users.update_one(
            {"id": req.upline_id},
            {"$set": {"right_child_id": req.user_id}}
        )
    
    # Update target user
    await db.users.update_one(
        {"id": req.user_id},
        {"$set": {
            "upline_id": req.upline_id,
            "position": req.position
        }}
    )
    
    # Record placement history
    history = PlacementHistory(
        user_id=req.user_id,
        old_upline_id=old_upline_id,
        new_upline_id=req.upline_id,
        old_position=old_position,
        new_position=req.position,
        admin_id=admin.id,
        admin_name=admin.name,
        action_type=action_type
    )
    await db.placement_history.insert_one(history.model_dump())
    
    # If user has investments, recalculate volumes
    if target_user.total_invested > 0:
        # Remove volumes from old upline tree
        if old_upline_id:
            await recalculate_volumes_after_removal(old_upline_id, target_user.total_invested)
        
        # Add volumes to new upline tree
        await update_volumes_upline(req.user_id, target_user.total_invested)
    
    return {
        "message": "Kullanıcı başarıyla yerleştirildi",
        "action": action_type,
        "user_name": target_user.name,
        "upline_name": upline.name,
        "position": req.position
    }

async def recalculate_volumes_after_removal(upline_id: str, amount: float):
    """Subtract volume from upline tree when user is removed"""
    current_upline_doc = await db.users.find_one({"id": upline_id}, {"_id": 0})
    if not current_upline_doc:
        return
    
    current_upline = User(**current_upline_doc)
    
    # Find which position the removed user was in
    if current_upline.left_child_id:
        # Subtract from left volume
        await db.users.update_one(
            {"id": upline_id},
            {"$inc": {"left_volume": -amount}}
        )
    elif current_upline.right_child_id:
        # Subtract from right volume
        await db.users.update_one(
            {"id": upline_id},
            {"$inc": {"right_volume": -amount}}
        )
    
    # Continue up the tree
    if current_upline.upline_id:
        await recalculate_volumes_after_removal(current_upline.upline_id, amount)

@api_router.get("/admin/placement-history")
async def get_placement_history(admin: User = Depends(require_admin)):
    """Get all placement history records"""
    history = await db.placement_history.find({}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    
    # Enrich with user names
    for record in history:
        user_doc = await db.users.find_one({"id": record["user_id"]}, {"_id": 0, "name": 1})
        if user_doc:
            record["user_name"] = user_doc["name"]
        
        if record.get("new_upline_id"):
            upline_doc = await db.users.find_one({"id": record["new_upline_id"]}, {"_id": 0, "name": 1})
            if upline_doc:
                record["new_upline_name"] = upline_doc["name"]
    
    return history

@api_router.get("/admin/stats")
async def admin_get_stats(admin: User = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_investments = await db.investments.count_documents({"is_active": True})
    
    # Calculate total volume
    pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$total_invested"}}}
    ]
    result = await db.users.aggregate(pipeline).to_list(1)
    total_volume = result[0]["total"] if result else 0
    
    pending_withdrawals = await db.transactions.count_documents({
        "type": "withdrawal",
        "status": "pending"
    })
    
    return {
        "total_users": total_users,
        "total_investments": total_investments,
        "total_volume": total_volume,
        "pending_withdrawals": pending_withdrawals
    }

# ==================== PUBLIC ENDPOINTS ====================

@api_router.get("/public/stats")
async def get_public_stats():
    total_users = await db.users.count_documents({})
    pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$total_invested"}}}
    ]
    result = await db.users.aggregate(pipeline).to_list(1)
    total_volume = result[0]["total"] if result else 0
    
    return {
        "total_users": total_users,
        "total_volume": total_volume
    }

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()