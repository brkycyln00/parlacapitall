from fastapi import FastAPI, APIRouter, HTTPException, Response, Request, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import secrets
import jwt
import hashlib

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
    email: str
    password: str
    name: str
    referral_code: Optional[str] = None

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

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
    
    # Create new user
    user = User(
        email=req.email,
        name=req.name,
        password_hash=hash_password(req.password),
        upline_id=upline_user.id if upline_user else None
    )
    
    # Place user in binary tree (only if has upline)
    if upline_user:
        if not upline_user.left_child_id:
            # Place on left
            await db.users.update_one(
                {"id": upline_user.id},
                {"$set": {"left_child_id": user.id}}
            )
            user.position = "left"
        elif not upline_user.right_child_id:
            # Place on right
            await db.users.update_one(
                {"id": upline_user.id},
                {"$set": {"right_child_id": user.id}}
            )
            user.position = "right"
        else:
            # Both positions filled, find next available spot in the tree
            # For simplicity, place on left (you can implement more complex logic)
            user.position = "left"
        
        # Mark referral code as used
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
    
    # Create JWT token
    token = create_jwt_token(user.id)
    
    # Prepare response
    if upline_user:
        message = f"Kayıt başarılı! {upline_user.name} ağına eklendiniz."
        response_user = {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "referral_code": user.referral_code,
            "upline": {
                "name": upline_user.name,
                "referral_code": upline_user.referral_code
            }
        }
    else:
        message = "Kayıt başarılı!"
        response_user = {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "referral_code": user.referral_code
        }
    
    return {
        "message": message,
        "token": token,
        "user": response_user
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
async def generate_referral_code(request: Request):
    """Generate a new referral code for the authenticated user"""
    user = await require_auth(request)
    
    # Create new referral code
    new_code = ReferralCode(
        user_id=user.id,
        code=secrets.token_urlsafe(8)
    )
    
    code_dict = new_code.model_dump()
    await db.referral_codes.insert_one(code_dict)
    
    return {
        "success": True,
        "code": new_code.code,
        "expires_at": new_code.expires_at,
        "message": "Yeni referans kodu oluşturuldu!"
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
    
    # Update user
    await db.users.update_one(
        {"id": target_user.id},
        {"$set": {
            "package": request.package,
            "package_amount": request.amount,
            "investment_date": investment.investment_date,
            "total_invested": target_user.total_invested + request.amount,
            "wallet_balance": target_user.wallet_balance + request.amount
        }}
    )
    
    # Calculate and add commission to upline if user has one
    if target_user.upline_id:
        # Get commission rate based on package
        commission_rates = {
            "silver": 0.05,   # 5%
            "gold": 0.10,     # 10%
            "platinum": 0.15  # 15%
        }
        
        commission_rate = commission_rates.get(request.package, 0)
        commission_amount = request.amount * commission_rate
        
        # Update upline's total commissions
        await db.users.update_one(
            {"id": target_user.upline_id},
            {"$inc": {"total_commissions": commission_amount}}
        )
        
        # Create commission transaction for upline
        commission_transaction = Transaction(
            user_id=target_user.upline_id,
            type="commission",
            amount=commission_amount,
            status="completed",
            description=f"Referans komisyonu - {target_user.name} ({request.package.upper()} paketi)"
        )
        await db.transactions.insert_one(commission_transaction.model_dump())
    
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
    
    return {
        "user": user.model_dump(),
        "active_referral_code": active_code,
        "referrals": referrals,
        "investment": investment,
        "transactions": transactions,
        "network": {
            "left": left_child,
            "right": right_child
        }
    }

@api_router.get("/network/tree")
async def get_network_tree(user: User = Depends(require_auth)):
    async def build_tree(user_id: str, depth: int = 0, max_depth: int = 5):
        if depth >= max_depth:
            return None
        
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            return None
        
        node = {
            "id": user_doc["id"],
            "name": user_doc["name"],
            "package": user_doc.get("package"),
            "total_invested": user_doc.get("total_invested", 0),
            "left": None,
            "right": None
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

@api_router.get("/validate-referral/{code}")
async def validate_referral_code(code: str):
    user = await db.users.find_one({"referral_code": code}, {"_id": 0})
    if user:
        return {"valid": True, "name": user["name"]}
    return {"valid": False}

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