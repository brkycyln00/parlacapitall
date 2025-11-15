import requests
import subprocess
import time

# Create test user and session
timestamp = str(int(time.time()))
user_id = f"test-user-{timestamp}"
session_token = f"test_session_{timestamp}"

print(f"Creating test user: {user_id}")
print(f"Session token: {session_token}")

mongo_commands = f"""
use('test_database');

db.users.insertOne({{
    id: '{user_id}',
    email: 'test.{timestamp}@example.com',
    name: 'Test User',
    picture: 'https://via.placeholder.com/150',
    referral_code: 'TEST{timestamp[-6:]}',
    wallet_balance: 100.0,
    is_admin: false,
    created_at: new Date().toISOString()
}});

db.user_sessions.insertOne({{
    user_id: '{user_id}',
    session_token: '{session_token}',
    expires_at: new Date(Date.now() + 7*24*60*60*1000),
    created_at: new Date()
}});

print('Test data created');
"""

try:
    result = subprocess.run(['mongosh', '--eval', mongo_commands], capture_output=True, text=True, timeout=30)
    print("MongoDB result:", result.stdout)
    if result.stderr:
        print("MongoDB error:", result.stderr)
except Exception as e:
    print(f"MongoDB error: {e}")

# Test the auth endpoint
print("\nTesting auth endpoint...")
try:
    response = requests.get(
        "https://parlamoney.preview.emergentagent.com/api/auth/me",
        headers={"Authorization": f"Bearer {session_token}"},
        timeout=10
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Request error: {e}")

# Cleanup
print("\nCleaning up...")
cleanup_commands = f"""
use('test_database');
db.users.deleteOne({{id: '{user_id}'}});
db.user_sessions.deleteOne({{session_token: '{session_token}'}});
print('Cleanup done');
"""

try:
    subprocess.run(['mongosh', '--eval', cleanup_commands], capture_output=True, text=True, timeout=30)
    print("Cleanup completed")
except Exception as e:
    print(f"Cleanup error: {e}")