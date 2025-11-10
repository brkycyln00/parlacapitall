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
    token = await get_session_token(request)
    if not token:
        return None
    
    # Check if session exists and is valid
    session_doc = await db.user_sessions.find_one({"session_token": token})
    if not session_doc:
        return None
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
        # Ensure timezone awareness
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
    elif isinstance(expires_at, datetime):
        # Handle datetime objects from MongoDB
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": token})
        return None
    
    # Get user
    user_doc = await db.users.find_one({"id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    
    return User(**user_doc)

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

# ==================== AUTH ENDPOINTS ====================

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