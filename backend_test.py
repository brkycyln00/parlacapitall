import requests
import sys
import json
from datetime import datetime
import time

class ParlaCapitalAPITester:
    def __init__(self, base_url="https://parlainvest.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.test_user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
            self.failed_tests.append({"test": name, "error": details})

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.session_token:
            test_headers['Authorization'] = f'Bearer {self.session_token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_public_endpoints(self):
        """Test public endpoints that don't require authentication"""
        print("\n🔍 Testing Public Endpoints...")
        
        # Test public stats
        success, response = self.run_test(
            "Public Stats",
            "GET",
            "public/stats",
            200
        )
        
        # Test packages endpoint
        success, response = self.run_test(
            "Get Packages",
            "GET", 
            "packages",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} packages")
            for pkg in response:
                print(f"   - {pkg.get('name', 'Unknown')}: ${pkg.get('amount', 0)}")

    def test_referral_validation_system(self):
        """Test referral code validation system comprehensively"""
        print("\n🔗 Testing Referral Code Validation System...")
        
        # First create a seed user to use as upline
        seed_user_id, seed_referral_code = self.create_seed_user()
        if not seed_user_id:
            print("❌ Cannot test referral system - seed user creation failed")
            return
        
        print(f"   ✓ Seed user created with referral code: {seed_referral_code}")
        
        # Test 1: Validate valid referral code
        success, response = self.run_test(
            "Validate Valid Referral Code",
            "GET",
            f"auth/validate-referral/{seed_referral_code}",
            200
        )
        
        if success and isinstance(response, dict):
            if response.get('valid') == True and response.get('upline_name'):
                print(f"   ✓ Valid referral code accepted - Upline: {response.get('upline_name')}")
            else:
                print(f"   ❌ Valid referral code response incorrect: {response}")
        
        # Test 2: Validate invalid referral code
        success, response = self.run_test(
            "Validate Invalid Referral Code",
            "GET",
            "auth/validate-referral/INVALID123",
            200
        )
        
        if success and isinstance(response, dict):
            if response.get('valid') == False and response.get('message') == "Yanlış referans kodu girdiniz!":
                print("   ✓ Invalid referral code correctly rejected with Turkish message")
            else:
                print(f"   ❌ Invalid referral code response incorrect: {response}")
        
        # Test 3: Validate empty referral code
        success, response = self.run_test(
            "Validate Empty Referral Code",
            "GET",
            "auth/validate-referral/",
            404  # Should return 404 for empty path
        )
        
        # Test 4: Validate referral code with special characters
        success, response = self.run_test(
            "Validate Special Characters Referral Code",
            "GET",
            "auth/validate-referral/@#$%^&*()",
            200
        )
        
        if success and isinstance(response, dict):
            if response.get('valid') == False:
                print("   ✓ Special characters referral code correctly rejected")
        
        # Test 5: Registration with valid referral code
        timestamp = str(int(time.time()))
        registration_data = {
            "email": f"newuser.{timestamp}@example.com",
            "password": "SecurePass123!",
            "name": f"New User {timestamp}",
            "referral_code": seed_referral_code
        }
        
        success, response = self.run_test(
            "Register with Valid Referral Code",
            "POST",
            "auth/register",
            200,
            data=registration_data
        )
        
        new_user_id = None
        if success and isinstance(response, dict):
            if response.get('token') and response.get('user'):
                new_user_id = response['user']['id']
                print(f"   ✓ Registration successful with valid referral code")
                print(f"   ✓ New user placed under: {response['user']['upline']['name']}")
            else:
                print(f"   ❌ Registration response incorrect: {response}")
        
        # Test 6: Registration with invalid referral code
        invalid_registration_data = {
            "email": f"invaliduser.{timestamp}@example.com",
            "password": "SecurePass123!",
            "name": f"Invalid User {timestamp}",
            "referral_code": "INVALID123"
        }
        
        success, response = self.run_test(
            "Register with Invalid Referral Code",
            "POST",
            "auth/register",
            400,
            data=invalid_registration_data
        )
        
        if success and isinstance(response, dict):
            if "Geçersiz referans kodu" in response.get('detail', ''):
                print("   ✓ Registration correctly rejected with Turkish error message")
            else:
                print(f"   ❌ Registration error message incorrect: {response}")
        
        # Test 7: Registration without referral code
        no_referral_data = {
            "email": f"noreferral.{timestamp}@example.com",
            "password": "SecurePass123!",
            "name": f"No Referral User {timestamp}"
        }
        
        success, response = self.run_test(
            "Register without Referral Code",
            "POST",
            "auth/register",
            400,
            data=no_referral_data
        )
        
        if success and isinstance(response, dict):
            if "Referans kodu zorunludur" in response.get('detail', ''):
                print("   ✓ Registration correctly rejected - referral code required")
            else:
                print(f"   ❌ Registration error message incorrect: {response}")
        
        # Test 8: Binary tree placement - Register second child
        if new_user_id:
            second_child_data = {
                "email": f"secondchild.{timestamp}@example.com",
                "password": "SecurePass123!",
                "name": f"Second Child {timestamp}",
                "referral_code": seed_referral_code
            }
            
            success, response = self.run_test(
                "Register Second Child (Binary Tree)",
                "POST",
                "auth/register",
                200,
                data=second_child_data
            )
            
            if success:
                print("   ✓ Second child registered successfully")
                
                # Verify binary tree structure
                self.verify_binary_tree_placement(seed_user_id, new_user_id, response['user']['id'])
        
        return seed_user_id, seed_referral_code

    def create_seed_user(self):
        """Create a seed user to act as upline for referral testing"""
        timestamp = str(int(time.time()))
        seed_user_id = f"seed-user-{timestamp}"
        seed_referral_code = f"SEED{timestamp[-6:]}"
        
        mongo_commands = f"""
        use('test_database');
        
        // Create seed user
        db.users.insertOne({{
            id: '{seed_user_id}',
            email: 'seed.user.{timestamp}@example.com',
            name: 'Seed User {timestamp}',
            picture: 'https://via.placeholder.com/150',
            referral_code: '{seed_referral_code}',
            upline_id: null,
            package: 'silver',
            package_amount: 250.0,
            investment_date: new Date().toISOString(),
            total_invested: 250.0,
            weekly_earnings: 0.0,
            total_commissions: 0.0,
            left_child_id: null,
            right_child_id: null,
            position: null,
            left_volume: 0.0,
            right_volume: 0.0,
            binary_earnings: 0.0,
            career_level: 'None',
            career_points: 0.0,
            career_rewards: 0.0,
            wallet_balance: 100.0,
            is_admin: false,
            created_at: new Date().toISOString()
        }});
        
        print('Seed user created with ID: {seed_user_id}');
        print('Referral code: {seed_referral_code}');
        """
        
        try:
            import subprocess
            result = subprocess.run(
                ['mongosh', '--eval', mongo_commands],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                return seed_user_id, seed_referral_code
            else:
                print(f"❌ Seed user creation failed: {result.stderr}")
                return None, None
                
        except Exception as e:
            print(f"❌ Failed to create seed user: {str(e)}")
            return None, None

    def verify_binary_tree_placement(self, upline_id, first_child_id, second_child_id):
        """Verify that users are correctly placed in binary tree"""
        print("   🌳 Verifying binary tree placement...")
        
        mongo_commands = f"""
        use('test_database');
        
        // Get upline user
        var upline = db.users.findOne({{id: '{upline_id}'}});
        
        // Get first child
        var firstChild = db.users.findOne({{id: '{first_child_id}'}});
        
        // Get second child  
        var secondChild = db.users.findOne({{id: '{second_child_id}'}});
        
        print('Upline left_child_id: ' + upline.left_child_id);
        print('Upline right_child_id: ' + upline.right_child_id);
        print('First child position: ' + firstChild.position);
        print('Second child position: ' + secondChild.position);
        
        // Verify placement
        if (upline.left_child_id && upline.right_child_id) {{
            print('✓ Both positions filled in upline');
        }}
        
        if (firstChild.position === 'left' && secondChild.position === 'right') {{
            print('✓ Children correctly positioned');
        }} else if (firstChild.position === 'right' && secondChild.position === 'left') {{
            print('✓ Children correctly positioned (reverse order)');
        }} else {{
            print('❌ Children positioning incorrect');
        }}
        """
        
        try:
            import subprocess
            result = subprocess.run(
                ['mongosh', '--eval', mongo_commands],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print("   ✓ Binary tree verification completed")
                if "✓ Both positions filled" in result.stdout and "✓ Children correctly positioned" in result.stdout:
                    print("   ✅ Binary tree placement is correct")
                else:
                    print("   ⚠️ Binary tree placement may have issues")
            else:
                print(f"   ❌ Binary tree verification failed: {result.stderr}")
                
        except Exception as e:
            print(f"   ❌ Failed to verify binary tree: {str(e)}")

    def create_test_user_session(self):
        """Create test user and session in MongoDB for testing"""
        print("\n🔧 Creating test user and session...")
        
        # Generate unique IDs
        timestamp = str(int(time.time()))
        self.test_user_id = f"test-user-{timestamp}"
        self.session_token = f"test_session_{timestamp}"
        
        # MongoDB commands to create test data
        mongo_commands = f"""
        use('test_database');
        
        // Create test user
        db.users.insertOne({{
            id: '{self.test_user_id}',
            email: 'test.user.{timestamp}@example.com',
            name: 'Test User {timestamp}',
            picture: 'https://via.placeholder.com/150',
            referral_code: 'TEST{timestamp[-6:]}',
            upline_id: null,
            package: null,
            package_amount: 0.0,
            investment_date: null,
            total_invested: 0.0,
            weekly_earnings: 0.0,
            total_commissions: 0.0,
            left_child_id: null,
            right_child_id: null,
            position: null,
            left_volume: 0.0,
            right_volume: 0.0,
            binary_earnings: 0.0,
            career_level: 'None',
            career_points: 0.0,
            career_rewards: 0.0,
            wallet_balance: 100.0,
            is_admin: false,
            created_at: new Date().toISOString()
        }});
        
        // Create test session
        db.user_sessions.insertOne({{
            user_id: '{self.test_user_id}',
            session_token: '{self.session_token}',
            expires_at: new Date(Date.now() + 7*24*60*60*1000),
            created_at: new Date()
        }});
        
        print('Test user created with ID: {self.test_user_id}');
        print('Session token: {self.session_token}');
        """
        
        try:
            import subprocess
            result = subprocess.run(
                ['mongosh', '--eval', mongo_commands],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print(f"✅ Test user created: {self.test_user_id}")
                print(f"✅ Session token: {self.session_token}")
                return True
            else:
                print(f"❌ MongoDB setup failed: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Failed to create test data: {str(e)}")
            return False

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication Endpoints...")
        
        # Test /auth/me with valid session
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        
        if success and isinstance(response, dict):
            print(f"   ✓ User authenticated: {response.get('name', 'Unknown')}")
            print(f"   ✓ Email: {response.get('email', 'Unknown')}")
            print(f"   ✓ Wallet Balance: ${response.get('wallet_balance', 0)}")
        
        # Don't logout here - save it for the end

    def test_dashboard_endpoints(self):
        """Test dashboard and user data endpoints"""
        print("\n📊 Testing Dashboard Endpoints...")
        
        # Test dashboard data
        success, response = self.run_test(
            "Get Dashboard Data",
            "GET",
            "dashboard",
            200
        )
        
        if success and isinstance(response, dict):
            user_data = response.get('user', {})
            print(f"   ✓ Dashboard loaded for: {user_data.get('name', 'Unknown')}")
            print(f"   ✓ Referrals: {len(response.get('referrals', []))}")
            print(f"   ✓ Transactions: {len(response.get('transactions', []))}")

    def test_investment_endpoints(self):
        """Test investment creation and related endpoints"""
        print("\n💰 Testing Investment Endpoints...")
        
        # Test investment creation with mock payment (using query parameters)
        success, response = self.run_test(
            "Create Investment - Silver Package",
            "POST",
            "investments/create?package=silver&crypto_type=mock",
            200
        )
        
        if success:
            print("   ✓ Investment created successfully")

    def test_withdrawal_endpoints(self):
        """Test withdrawal request functionality"""
        print("\n💸 Testing Withdrawal Endpoints...")
        
        # Test withdrawal request (using query parameters)
        success, response = self.run_test(
            "Create Withdrawal Request",
            "POST",
            "withdrawal/request?amount=50.0&crypto_type=usdt&wallet_address=0x1234567890abcdef1234567890abcdef12345678",
            200
        )
        
        if success:
            print("   ✓ Withdrawal request created")

    def create_admin_user(self):
        """Create an admin user for testing admin endpoints"""
        print("\n👑 Creating admin user...")
        
        timestamp = str(int(time.time()))
        admin_user_id = f"admin-user-{timestamp}"
        admin_session_token = f"admin_session_{timestamp}"
        
        mongo_commands = f"""
        use('test_database');
        
        // Create admin user
        db.users.insertOne({{
            id: '{admin_user_id}',
            email: 'admin.{timestamp}@example.com',
            name: 'Admin User {timestamp}',
            picture: 'https://via.placeholder.com/150',
            referral_code: 'ADMIN{timestamp[-6:]}',
            upline_id: null,
            package: null,
            package_amount: 0.0,
            investment_date: null,
            total_invested: 0.0,
            weekly_earnings: 0.0,
            total_commissions: 0.0,
            left_child_id: null,
            right_child_id: null,
            position: null,
            left_volume: 0.0,
            right_volume: 0.0,
            binary_earnings: 0.0,
            career_level: 'None',
            career_points: 0.0,
            career_rewards: 0.0,
            wallet_balance: 1000.0,
            is_admin: true,
            created_at: new Date().toISOString()
        }});
        
        // Create admin session
        db.user_sessions.insertOne({{
            user_id: '{admin_user_id}',
            session_token: '{admin_session_token}',
            expires_at: new Date(Date.now() + 7*24*60*60*1000),
            created_at: new Date()
        }});
        
        print('Admin user created with ID: {admin_user_id}');
        """
        
        try:
            import subprocess
            result = subprocess.run(
                ['mongosh', '--eval', mongo_commands],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print(f"✅ Admin user created: {admin_user_id}")
                return admin_session_token
            else:
                print(f"❌ Admin user creation failed: {result.stderr}")
                return None
                
        except Exception as e:
            print(f"❌ Failed to create admin user: {str(e)}")
            return None

    def test_admin_endpoints(self):
        """Test admin panel endpoints"""
        print("\n👑 Testing Admin Endpoints...")
        
        # Create admin user and get token
        admin_token = self.create_admin_user()
        if not admin_token:
            print("❌ Cannot test admin endpoints - admin user creation failed")
            return
        
        # Temporarily switch to admin token
        original_token = self.session_token
        self.session_token = admin_token
        
        # Test admin stats
        success, response = self.run_test(
            "Admin Stats",
            "GET",
            "admin/stats",
            200
        )
        
        if success and isinstance(response, dict):
            print(f"   ✓ Total Users: {response.get('total_users', 0)}")
            print(f"   ✓ Total Investments: {response.get('total_investments', 0)}")
            print(f"   ✓ Total Volume: ${response.get('total_volume', 0)}")
        
        # Test admin users list
        success, response = self.run_test(
            "Admin Users List",
            "GET",
            "admin/users",
            200
        )
        
        # Test admin transactions list
        success, response = self.run_test(
            "Admin Transactions List",
            "GET",
            "admin/transactions",
            200
        )
        
        # Test weekly profit distribution
        success, response = self.run_test(
            "Weekly Profit Distribution",
            "POST",
            "admin/weekly-profit/distribute",
            200
        )
        
        if success and isinstance(response, dict):
            print(f"   ✓ Distributed to: {response.get('distributed_to', 0)} users")
            print(f"   ✓ Total amount: ${response.get('total_amount', 0)}")
        
        # Restore original token
        self.session_token = original_token

    def cleanup_test_data(self):
        """Clean up test data from MongoDB"""
        print("\n🧹 Cleaning up test data...")
        
        mongo_commands = """
        use('test_database');
        
        // Remove test users
        var result1 = db.users.deleteMany({email: /test\.user\./});
        var result2 = db.users.deleteMany({email: /admin\./});
        var result3 = db.users.deleteMany({email: /seed\.user\./});
        var result4 = db.users.deleteMany({email: /newuser\./});
        var result5 = db.users.deleteMany({email: /invaliduser\./});
        var result6 = db.users.deleteMany({email: /noreferral\./});
        var result7 = db.users.deleteMany({email: /secondchild\./});
        
        // Remove test sessions
        var result8 = db.user_sessions.deleteMany({session_token: /test_session/});
        var result9 = db.user_sessions.deleteMany({session_token: /admin_session/});
        
        // Remove test investments
        var result10 = db.investments.deleteMany({user_id: /test-user-/});
        var result11 = db.investments.deleteMany({user_id: /admin-user-/});
        var result12 = db.investments.deleteMany({user_id: /seed-user-/});
        
        // Remove test transactions
        var result13 = db.transactions.deleteMany({user_id: /test-user-/});
        var result14 = db.transactions.deleteMany({user_id: /admin-user-/});
        var result15 = db.transactions.deleteMany({user_id: /seed-user-/});
        
        print('Cleanup completed');
        print('Users deleted: ' + (result1.deletedCount + result2.deletedCount + result3.deletedCount + result4.deletedCount + result5.deletedCount + result6.deletedCount + result7.deletedCount));
        print('Sessions deleted: ' + (result8.deletedCount + result9.deletedCount));
        """
        
        try:
            import subprocess
            result = subprocess.run(
                ['mongosh', '--eval', mongo_commands],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print("✅ Test data cleaned up successfully")
            else:
                print(f"⚠️ Cleanup warning: {result.stderr}")
                
        except Exception as e:
            print(f"⚠️ Cleanup failed: {str(e)}")

    def test_multi_use_referral_system(self):
        """Test the new multi-use referral code system comprehensively"""
        print("\n🔗 Testing Multi-Use Referral Code System...")
        
        # Create test user and session for authenticated tests
        if not self.create_test_user_session():
            print("❌ Cannot test referral system - user creation failed")
            return
        
        # Test 1: Code Generation - POST /api/referral/generate
        print("\n1️⃣ Testing Code Generation...")
        
        # Generate first referral code
        success1, response1 = self.run_test(
            "Generate First Referral Code",
            "POST",
            "referral/generate",
            200
        )
        
        first_code = None
        if success1 and isinstance(response1, dict):
            first_code = response1.get('code')
            expires_at = response1.get('expires_at')
            print(f"   ✓ First code generated: {first_code}")
            print(f"   ✓ Expires at: {expires_at}")
            
            # Verify response structure
            if response1.get('success') and first_code and expires_at:
                print("   ✅ Code generation response structure correct")
            else:
                print(f"   ❌ Code generation response incorrect: {response1}")
        
        # Generate second referral code (test unlimited generation)
        success2, response2 = self.run_test(
            "Generate Second Referral Code",
            "POST", 
            "referral/generate",
            200
        )
        
        second_code = None
        if success2 and isinstance(response2, dict):
            second_code = response2.get('code')
            print(f"   ✓ Second code generated: {second_code}")
            
            # Verify codes are unique
            if first_code and second_code and first_code != second_code:
                print("   ✅ Generated codes are unique")
            else:
                print("   ❌ Generated codes are not unique")
        
        # Test 2: Code Expiry Validation
        print("\n2️⃣ Testing Code Expiry Validation...")
        
        if first_code:
            # Test immediate validation (should be valid)
            success, response = self.run_test(
                "Validate Fresh Code",
                "GET",
                f"auth/validate-referral/{first_code}",
                200
            )
            
            if success and isinstance(response, dict):
                if response.get('valid') == True:
                    print("   ✅ Fresh code is valid")
                else:
                    print(f"   ❌ Fresh code validation failed: {response}")
            
            # Manually expire the code in database and test
            print("   🕒 Manually expiring code in database...")
            self.expire_referral_code(first_code)
            
            # Test validation of expired code
            success, response = self.run_test(
                "Validate Expired Code",
                "GET",
                f"auth/validate-referral/{first_code}",
                200
            )
            
            if success and isinstance(response, dict):
                if response.get('valid') == False and response.get('message') == "Bu kodun süresi dolmuş!":
                    print("   ✅ Expired code correctly rejected with Turkish message")
                else:
                    print(f"   ❌ Expired code validation incorrect: {response}")
        
        # Test 3: Single-Use Validation
        print("\n3️⃣ Testing Single-Use Validation...")
        
        if second_code:
            # Register first user with the code
            timestamp = str(int(time.time()))
            user_a_data = {
                "email": f"usera.{timestamp}@example.com",
                "password": "SecurePass123!",
                "name": f"User A {timestamp}",
                "referral_code": second_code
            }
            
            success, response = self.run_test(
                "Register User A with Code",
                "POST",
                "auth/register",
                200,
                data=user_a_data
            )
            
            if success:
                print("   ✅ User A registered successfully with code")
                
                # Try to register second user with same code (should fail)
                user_b_data = {
                    "email": f"userb.{timestamp}@example.com",
                    "password": "SecurePass123!",
                    "name": f"User B {timestamp}",
                    "referral_code": second_code
                }
                
                success, response = self.run_test(
                    "Register User B with Same Code",
                    "POST",
                    "auth/register",
                    400,
                    data=user_b_data
                )
                
                if success and isinstance(response, dict):
                    if "Bu referans kodu daha önce kullanılmış" in response.get('detail', ''):
                        print("   ✅ Used code correctly rejected with Turkish message")
                    else:
                        print(f"   ❌ Used code error message incorrect: {response}")
                
                # Verify code is marked as used in database
                self.verify_code_usage(second_code)
        
        # Test 4: GET /api/referral/my-codes
        print("\n4️⃣ Testing My Codes Endpoint...")
        
        success, response = self.run_test(
            "Get My Referral Codes",
            "GET",
            "referral/my-codes",
            200
        )
        
        if success and isinstance(response, dict):
            codes = response.get('codes', [])
            total = response.get('total', 0)
            print(f"   ✓ Found {total} used codes")
            
            if total > 0:
                for code_info in codes:
                    print(f"   ✓ Code: {code_info.get('code')} - Referred: {code_info.get('referred_user', {}).get('name', 'Unknown')}")
                print("   ✅ Used codes displayed with referral details")
            else:
                print("   ✓ No used codes (expected for new user)")
        
        # Test 5: Dashboard Active Code
        print("\n5️⃣ Testing Dashboard Active Code...")
        
        success, response = self.run_test(
            "Get Dashboard with Active Code",
            "GET",
            "dashboard",
            200
        )
        
        if success and isinstance(response, dict):
            active_code = response.get('active_referral_code')
            if active_code:
                print(f"   ✅ Dashboard returns active referral code: {active_code}")
            else:
                print("   ❌ Dashboard missing active_referral_code field")
        
        # Test 6: Mixed Case Codes
        print("\n6️⃣ Testing Mixed Case Codes...")
        
        # Generate a new code for mixed case testing
        success, response = self.run_test(
            "Generate Code for Mixed Case Test",
            "POST",
            "referral/generate", 
            200
        )
        
        if success and isinstance(response, dict):
            mixed_case_code = response.get('code')
            if mixed_case_code:
                print(f"   ✓ Generated code for case test: {mixed_case_code}")
                
                # Test validation with exact case
                success, response = self.run_test(
                    "Validate Exact Case Code",
                    "GET",
                    f"auth/validate-referral/{mixed_case_code}",
                    200
                )
                
                if success and response.get('valid') == True:
                    print("   ✅ Exact case validation works")
                
                # Test registration with exact case
                case_test_data = {
                    "email": f"casetest.{timestamp}@example.com",
                    "password": "SecurePass123!",
                    "name": f"Case Test User {timestamp}",
                    "referral_code": mixed_case_code
                }
                
                success, response = self.run_test(
                    "Register with Exact Case Code",
                    "POST",
                    "auth/register",
                    200,
                    data=case_test_data
                )
                
                if success:
                    print("   ✅ Registration with exact case works")
        
        print("\n✅ Multi-Use Referral System Testing Complete")

    def expire_referral_code(self, code):
        """Manually expire a referral code in database for testing"""
        mongo_commands = f"""
        use('test_database');
        
        // Set expires_at to past time
        var result = db.referral_codes.updateOne(
            {{code: '{code}'}},
            {{$set: {{expires_at: new Date(Date.now() - 60000).toISOString()}}}}
        );
        
        print('Code expired: ' + result.modifiedCount);
        """
        
        try:
            import subprocess
            result = subprocess.run(
                ['mongosh', '--eval', mongo_commands],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                print("   ✓ Code manually expired in database")
            else:
                print(f"   ❌ Failed to expire code: {result.stderr}")
                
        except Exception as e:
            print(f"   ❌ Failed to expire code: {str(e)}")

    def verify_code_usage(self, code):
        """Verify that a referral code is marked as used in database"""
        mongo_commands = f"""
        use('test_database');
        
        var codeDoc = db.referral_codes.findOne({{code: '{code}'}});
        
        if (codeDoc) {{
            print('Code found - is_used: ' + codeDoc.is_used);
            print('Used by: ' + codeDoc.used_by);
            print('Used at: ' + codeDoc.used_at);
            
            if (codeDoc.is_used === true && codeDoc.used_by && codeDoc.used_at) {{
                print('✅ Code correctly marked as used');
            }} else {{
                print('❌ Code usage not properly recorded');
            }}
        }} else {{
            print('❌ Code not found in database');
        }}
        """
        
        try:
            import subprocess
            result = subprocess.run(
                ['mongosh', '--eval', mongo_commands],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                if "✅ Code correctly marked as used" in result.stdout:
                    print("   ✅ Code usage properly recorded in database")
                else:
                    print("   ❌ Code usage not properly recorded")
            else:
                print(f"   ❌ Failed to verify code usage: {result.stderr}")
                
        except Exception as e:
            print(f"   ❌ Failed to verify code usage: {str(e)}")

    def run_all_tests(self):
        """Run comprehensive API tests"""
        print("🚀 Starting ParlaCapital API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test public endpoints first
        self.test_public_endpoints()
        
        # Test NEW multi-use referral system (CRITICAL PRIORITY)
        self.test_multi_use_referral_system()
        
        # Test old referral validation system for comparison
        self.test_referral_validation_system()
        
        # Test other authenticated endpoints if we have session
        if self.session_token:
            self.test_auth_endpoints()
            self.test_dashboard_endpoints()
            self.test_investment_endpoints()
            self.test_withdrawal_endpoints()
            
            # Test admin endpoints
            self.test_admin_endpoints()
            
            # Test logout at the end
            success, response = self.run_test(
                "Logout",
                "POST",
                "auth/logout",
                200
            )
        
        # Cleanup
        self.cleanup_test_data()
        
        return self.get_results()

    def get_results(self):
        """Get test results summary"""
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {len(self.failed_tests)}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"   • {failure['test']}: {failure['error']}")
        
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.failed_tests,
            "success_rate": (self.tests_passed/self.tests_run*100) if self.tests_run > 0 else 0
        }

def main():
    tester = ParlaCapitalAPITester()
    results = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if len(results["failed_tests"]) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())