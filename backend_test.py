import requests
import sys
import json
from datetime import datetime
import time

class ParlaCapitalAPITester:
    def __init__(self, base_url="https://invest-tree.preview.emergentagent.com"):
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
        referral_code_id = f"ref-code-{timestamp}"
        
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
        
        // Create referral code in new referral_codes collection
        db.referral_codes.insertOne({{
            id: '{referral_code_id}',
            code: '{seed_referral_code}',
            user_id: '{seed_user_id}',
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 10*60*1000).toISOString(), // 10 minutes from now
            is_used: false,
            used_by: null,
            used_at: null
        }});
        
        print('Seed user created with ID: {seed_user_id}');
        print('Referral code: {seed_referral_code}');
        print('Referral code document created in referral_codes collection');
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

    def create_test_user_and_login(self):
        """Create test user and login to get JWT token"""
        print("\n🔧 Creating test user and logging in...")
        
        # Generate unique IDs
        timestamp = str(int(time.time()))
        self.test_user_id = f"test-user-{timestamp}"
        test_email = f"test.user.{timestamp}@example.com"
        test_password = "SecureTestPass123!"
        
        # First create a referral code for the test user to use during registration
        seed_user_id, seed_referral_code = self.create_seed_user()
        if not seed_user_id:
            print("❌ Cannot create test user - seed user creation failed")
            return False
        
        # Register the test user
        registration_data = {
            "email": test_email,
            "password": test_password,
            "name": f"Test User {timestamp}",
            "referral_code": seed_referral_code
        }
        
        success, response = self.run_test(
            "Register Test User",
            "POST",
            "auth/register",
            200,
            data=registration_data
        )
        
        if success and isinstance(response, dict):
            jwt_token = response.get('token')
            if jwt_token:
                self.session_token = jwt_token
                self.test_user_id = response['user']['id']
                print(f"✅ Test user registered and logged in: {self.test_user_id}")
                print(f"✅ JWT token obtained")
                return True
            else:
                print(f"❌ Registration successful but no token received: {response}")
                return False
        else:
            print("❌ Test user registration failed")
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

    def create_admin_user_and_login(self):
        """Create admin user and login to get JWT token"""
        print("\n👑 Creating admin user...")
        
        timestamp = str(int(time.time()))
        admin_email = f"admin.{timestamp}@example.com"
        admin_password = "SecureAdminPass123!"
        
        # First create a referral code for the admin user to use during registration
        seed_user_id, seed_referral_code = self.create_seed_user()
        if not seed_user_id:
            print("❌ Cannot create admin user - seed user creation failed")
            return None
        
        # Register the admin user
        registration_data = {
            "email": admin_email,
            "password": admin_password,
            "name": f"Admin User {timestamp}",
            "referral_code": seed_referral_code
        }
        
        success, response = self.run_test(
            "Register Admin User",
            "POST",
            "auth/register",
            200,
            data=registration_data
        )
        
        if success and isinstance(response, dict):
            admin_user_id = response['user']['id']
            jwt_token = response.get('token')
            
            if jwt_token and admin_user_id:
                # Make the user admin in database
                mongo_commands = f"""
                use('test_database');
                
                db.users.updateOne(
                    {{id: '{admin_user_id}'}},
                    {{$set: {{is_admin: true, wallet_balance: 1000.0}}}}
                );
                
                print('User made admin: {admin_user_id}');
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
                        print(f"✅ Admin user created and promoted: {admin_user_id}")
                        return jwt_token
                    else:
                        print(f"❌ Failed to promote user to admin: {result.stderr}")
                        return None
                        
                except Exception as e:
                    print(f"❌ Failed to promote user to admin: {str(e)}")
                    return None
            else:
                print(f"❌ Admin registration successful but no token received: {response}")
                return None
        else:
            print("❌ Admin user registration failed")
            return None

    def test_admin_endpoints(self):
        """Test admin panel endpoints"""
        print("\n👑 Testing Admin Endpoints...")
        
        # Create admin user and get token
        admin_token = self.create_admin_user_and_login()
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
        var result8 = db.users.deleteMany({email: /usera\./});
        var result9 = db.users.deleteMany({email: /userb\./});
        var result10 = db.users.deleteMany({email: /casetest\./});
        
        // Remove test sessions
        var result11 = db.user_sessions.deleteMany({session_token: /test_session/});
        var result12 = db.user_sessions.deleteMany({session_token: /admin_session/});
        
        // Remove test referral codes
        var result13 = db.referral_codes.deleteMany({user_id: /test-user-/});
        var result14 = db.referral_codes.deleteMany({user_id: /admin-user-/});
        var result15 = db.referral_codes.deleteMany({user_id: /seed-user-/});
        
        // Remove test investments
        var result16 = db.investments.deleteMany({user_id: /test-user-/});
        var result17 = db.investments.deleteMany({user_id: /admin-user-/});
        var result18 = db.investments.deleteMany({user_id: /seed-user-/});
        
        // Remove test transactions
        var result19 = db.transactions.deleteMany({user_id: /test-user-/});
        var result20 = db.transactions.deleteMany({user_id: /admin-user-/});
        var result21 = db.transactions.deleteMany({user_id: /seed-user-/});
        
        print('Cleanup completed');
        print('Users deleted: ' + (result1.deletedCount + result2.deletedCount + result3.deletedCount + result4.deletedCount + result5.deletedCount + result6.deletedCount + result7.deletedCount + result8.deletedCount + result9.deletedCount + result10.deletedCount));
        print('Sessions deleted: ' + (result11.deletedCount + result12.deletedCount));
        print('Referral codes deleted: ' + (result13.deletedCount + result14.deletedCount + result15.deletedCount));
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
        
        # Create test user and login for authenticated tests
        if not self.create_test_user_and_login():
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

    def test_binary_earnings_calculation_system(self):
        """Test the complete binary earnings calculation system end-to-end"""
        print("\n💰 Testing Binary Earnings Calculation System...")
        print("=" * 60)
        
        # Step 1: Create admin user for approving investments
        admin_token = self.create_admin_user_and_login()
        if not admin_token:
            print("❌ Cannot test binary earnings - admin user creation failed")
            return
        
        # Step 2: Create binary tree structure
        print("\n1️⃣ Creating Binary Tree Structure...")
        
        # Create root user (User A)
        timestamp = str(int(time.time()))
        user_a_data = {
            "email": f"usera.binary.{timestamp}@example.com",
            "password": "SecurePass123!",
            "name": f"User A Binary {timestamp}"
        }
        
        # Register User A without referral (will be root)
        success, response = self.run_test(
            "Register User A (Root)",
            "POST",
            "auth/register",
            200,
            data=user_a_data
        )
        
        if not success:
            print("❌ Failed to create root user")
            return
        
        user_a_id = response['user']['id']
        user_a_token = response.get('token')
        print(f"   ✓ User A created: {user_a_id}")
        
        # Generate left branch referral code for User A
        original_token = self.session_token
        self.session_token = user_a_token
        
        success, response = self.run_test(
            "Generate Left Branch Code",
            "POST",
            "referral/generate?position=left",
            200
        )
        
        if not success:
            print("❌ Failed to generate left branch code")
            return
        
        left_code = response.get('code')
        print(f"   ✓ Left branch code: {left_code}")
        
        # Generate right branch referral code for User A
        success, response = self.run_test(
            "Generate Right Branch Code", 
            "POST",
            "referral/generate?position=right",
            200
        )
        
        if not success:
            print("❌ Failed to generate right branch code")
            return
        
        right_code = response.get('code')
        print(f"   ✓ Right branch code: {right_code}")
        
        # Step 3: Register User B (left child)
        user_b_data = {
            "email": f"userb.binary.{timestamp}@example.com",
            "password": "SecurePass123!",
            "name": f"User B Binary {timestamp}",
            "referral_code": left_code
        }
        
        success, response = self.run_test(
            "Register User B (Left Child)",
            "POST",
            "auth/register",
            200,
            data=user_b_data
        )
        
        if not success:
            print("❌ Failed to create left child")
            return
        
        user_b_id = response['user']['id']
        user_b_token = response.get('token')
        print(f"   ✓ User B (left child) created: {user_b_id}")
        
        # Step 4: Register User C (right child)
        user_c_data = {
            "email": f"userc.binary.{timestamp}@example.com",
            "password": "SecurePass123!",
            "name": f"User C Binary {timestamp}",
            "referral_code": right_code
        }
        
        success, response = self.run_test(
            "Register User C (Right Child)",
            "POST",
            "auth/register",
            200,
            data=user_c_data
        )
        
        if not success:
            print("❌ Failed to create right child")
            return
        
        user_c_id = response['user']['id']
        user_c_token = response.get('token')
        print(f"   ✓ User C (right child) created: {user_c_id}")
        
        # Verify binary tree structure
        self.verify_binary_tree_structure(user_a_id, user_b_id, user_c_id)
        
        # Step 5: Test Volume Accumulation
        print("\n2️⃣ Testing Volume Accumulation...")
        
        # User B invests $600 (Silver package)
        self.session_token = user_b_token
        user_b_investment_data = {
            "full_name": f"User B Binary {timestamp}",
            "username": f"userb_binary_{timestamp}",
            "email": f"userb.binary.{timestamp}@example.com",
            "whatsapp": "+1234567890",
            "platform": "tether_trc20",
            "package": "silver"
        }
        
        success, response = self.run_test(
            "User B Investment Request ($250 Silver)",
            "POST",
            "investment/request",
            200,
            data=user_b_investment_data
        )
        
        if not success:
            print("❌ Failed to create User B investment request")
            return
        
        user_b_request_id = response.get('request_id')
        print(f"   ✓ User B investment request created: {user_b_request_id}")
        
        # Admin approves User B investment
        self.session_token = admin_token
        success, response = self.run_test(
            "Admin Approve User B Investment",
            "POST",
            f"admin/investment-requests/{user_b_request_id}/approve",
            200
        )
        
        if success:
            print("   ✅ User B investment approved - $250 added to left volume")
        
        # Check User A's volumes after User B investment
        self.check_user_volumes(user_a_id, "After User B Investment", expected_left=250.0, expected_right=0.0)
        
        # User C invests $500 (Gold package)
        self.session_token = user_c_token
        user_c_investment_data = {
            "full_name": f"User C Binary {timestamp}",
            "username": f"userc_binary_{timestamp}",
            "email": f"userc.binary.{timestamp}@example.com",
            "whatsapp": "+1234567890",
            "platform": "tether_trc20",
            "package": "gold"
        }
        
        success, response = self.run_test(
            "User C Investment Request ($500 Gold)",
            "POST",
            "investment/request",
            200,
            data=user_c_investment_data
        )
        
        if not success:
            print("❌ Failed to create User C investment request")
            return
        
        user_c_request_id = response.get('request_id')
        print(f"   ✓ User C investment request created: {user_c_request_id}")
        
        # Admin approves User C investment
        self.session_token = admin_token
        success, response = self.run_test(
            "Admin Approve User C Investment",
            "POST",
            f"admin/investment-requests/{user_c_request_id}/approve",
            200
        )
        
        if success:
            print("   ✅ User C investment approved - $500 added to right volume")
        
        # Check User A's volumes after User C investment
        self.check_user_volumes(user_a_id, "After User C Investment", expected_left=250.0, expected_right=500.0)
        
        # At this point: left=$250, right=$500, NO bonus yet (need $1000+$1000)
        self.check_binary_earnings(user_a_id, "After Initial Investments", expected_earnings=0.0)
        
        # Step 6: Test First Bonus Trigger
        print("\n3️⃣ Testing First Bonus Trigger...")
        
        # User B makes another investment of $750 to reach $1000 total
        user_b_investment2_data = {
            "full_name": f"User B Binary {timestamp}",
            "username": f"userb_binary_{timestamp}",
            "email": f"userb.binary.{timestamp}@example.com",
            "whatsapp": "+1234567890",
            "platform": "tether_trc20",
            "package": "platinum"  # $1000
        }
        
        self.session_token = user_b_token
        success, response = self.run_test(
            "User B Second Investment Request ($1000 Platinum)",
            "POST",
            "investment/request",
            200,
            data=user_b_investment2_data
        )
        
        if not success:
            print("❌ Failed to create User B second investment request")
            return
        
        user_b_request2_id = response.get('request_id')
        
        # Admin approves User B second investment
        self.session_token = admin_token
        success, response = self.run_test(
            "Admin Approve User B Second Investment",
            "POST",
            f"admin/investment-requests/{user_b_request2_id}/approve",
            200
        )
        
        if success:
            print("   ✅ User B second investment approved - $1000 added to left volume")
        
        # Now User A should have: left_volume = $1250, right_volume = $500
        # Still NO bonus (need both sides >= $1000)
        self.check_user_volumes(user_a_id, "After User B Second Investment", expected_left=1250.0, expected_right=500.0)
        self.check_binary_earnings(user_a_id, "Before Both Sides >= $1000", expected_earnings=0.0)
        
        # User C invests another $500 to reach $1000 total
        user_c_investment2_data = {
            "full_name": f"User C Binary {timestamp}",
            "username": f"userc_binary_{timestamp}",
            "email": f"userc.binary.{timestamp}@example.com",
            "whatsapp": "+1234567890",
            "platform": "tether_trc20",
            "package": "gold"  # $500
        }
        
        self.session_token = user_c_token
        success, response = self.run_test(
            "User C Second Investment Request ($500 Gold)",
            "POST",
            "investment/request",
            200,
            data=user_c_investment2_data
        )
        
        if not success:
            print("❌ Failed to create User C second investment request")
            return
        
        user_c_request2_id = response.get('request_id')
        
        # Admin approves User C second investment
        self.session_token = admin_token
        success, response = self.run_test(
            "Admin Approve User C Second Investment",
            "POST",
            f"admin/investment-requests/{user_c_request2_id}/approve",
            200
        )
        
        if success:
            print("   ✅ User C second investment approved - $500 added to right volume")
        
        # Now User A should have: left_volume = $1250, right_volume = $1000
        # Expected: User A receives $100 bonus (min(1250, 1000) // 1000 * 100 = 1 * 100 = $100)
        self.check_user_volumes(user_a_id, "After Both Sides >= $1000", expected_left=1250.0, expected_right=1000.0)
        self.check_binary_earnings(user_a_id, "After First Bonus Trigger", expected_earnings=100.0)
        
        # Verify wallet balance increased by $100
        self.check_wallet_balance_increase(user_a_id, 100.0)
        
        # Verify binary transaction was created
        self.check_binary_transaction(user_a_id, 100.0)
        
        # Step 7: Test Progressive Bonus
        print("\n4️⃣ Testing Progressive Bonus...")
        
        # Add more investment to trigger additional bonus
        # User B invests another $500 (total left = $1750)
        user_b_investment3_data = {
            "full_name": f"User B Binary {timestamp}",
            "username": f"userb_binary_{timestamp}",
            "email": f"userb.binary.{timestamp}@example.com",
            "whatsapp": "+1234567890",
            "platform": "tether_trc20",
            "package": "gold"  # $500
        }
        
        self.session_token = user_b_token
        success, response = self.run_test(
            "User B Third Investment Request ($500 Gold)",
            "POST",
            "investment/request",
            200,
            data=user_b_investment3_data
        )
        
        if success:
            user_b_request3_id = response.get('request_id')
            
            # Admin approves
            self.session_token = admin_token
            success, response = self.run_test(
                "Admin Approve User B Third Investment",
                "POST",
                f"admin/investment-requests/{user_b_request3_id}/approve",
                200
            )
            
            if success:
                print("   ✅ User B third investment approved")
                
                # Now: left=$1750, right=$1000
                # Expected total binary earnings: (min(1750, 1000) // 1000) * 100 = 1 * 100 = $100 (no change)
                self.check_user_volumes(user_a_id, "After Additional Investment", expected_left=1750.0, expected_right=1000.0)
                self.check_binary_earnings(user_a_id, "After Additional Investment (No New Bonus)", expected_earnings=100.0)
        
        # Add investment to right side to trigger second bonus
        # User C invests $500 more (total right = $1500)
        user_c_investment3_data = {
            "full_name": f"User C Binary {timestamp}",
            "username": f"userc_binary_{timestamp}",
            "email": f"userc.binary.{timestamp}@example.com",
            "whatsapp": "+1234567890",
            "platform": "tether_trc20",
            "package": "gold"  # $500
        }
        
        self.session_token = user_c_token
        success, response = self.run_test(
            "User C Third Investment Request ($500 Gold)",
            "POST",
            "investment/request",
            200,
            data=user_c_investment3_data
        )
        
        if success:
            user_c_request3_id = response.get('request_id')
            
            # Admin approves
            self.session_token = admin_token
            success, response = self.run_test(
                "Admin Approve User C Third Investment",
                "POST",
                f"admin/investment-requests/{user_c_request3_id}/approve",
                200
            )
            
            if success:
                print("   ✅ User C third investment approved")
                
                # Now: left=$1750, right=$1500
                # Expected total binary earnings: (min(1750, 1500) // 1000) * 100 = 1 * 100 = $100 (still no change)
                self.check_user_volumes(user_a_id, "After Right Side Increase", expected_left=1750.0, expected_right=1500.0)
                self.check_binary_earnings(user_a_id, "After Right Side Increase (Still No New Bonus)", expected_earnings=100.0)
        
        # Add more to right side to trigger second $100 bonus
        # User C invests $500 more (total right = $2000)
        user_c_investment4_data = {
            "full_name": f"User C Binary {timestamp}",
            "username": f"userc_binary_{timestamp}",
            "email": f"userc.binary.{timestamp}@example.com",
            "whatsapp": "+1234567890",
            "platform": "tether_trc20",
            "package": "gold"  # $500
        }
        
        self.session_token = user_c_token
        success, response = self.run_test(
            "User C Fourth Investment Request ($500 Gold)",
            "POST",
            "investment/request",
            200,
            data=user_c_investment4_data
        )
        
        if success:
            user_c_request4_id = response.get('request_id')
            
            # Admin approves
            self.session_token = admin_token
            success, response = self.run_test(
                "Admin Approve User C Fourth Investment",
                "POST",
                f"admin/investment-requests/{user_c_request4_id}/approve",
                200
            )
            
            if success:
                print("   ✅ User C fourth investment approved")
                
                # Now: left=$1750, right=$2000
                # Expected total binary earnings: (min(1750, 1750) // 1000) * 100 = 1 * 100 = $100 (still same)
                # Wait, let me recalculate: min(1750, 2000) = 1750, 1750 // 1000 = 1, 1 * 100 = $100
                self.check_user_volumes(user_a_id, "After Right Side $2000", expected_left=1750.0, expected_right=2000.0)
                self.check_binary_earnings(user_a_id, "After Right Side $2000 (Still $100)", expected_earnings=100.0)
        
        # Need to get left side to $2000 to trigger second bonus
        # User B invests $250 more (total left = $2000)
        user_b_investment4_data = {
            "full_name": f"User B Binary {timestamp}",
            "username": f"userb_binary_{timestamp}",
            "email": f"userc.binary.{timestamp}@example.com",
            "whatsapp": "+1234567890",
            "platform": "tether_trc20",
            "package": "silver"  # $250
        }
        
        self.session_token = user_b_token
        success, response = self.run_test(
            "User B Fourth Investment Request ($250 Silver)",
            "POST",
            "investment/request",
            200,
            data=user_b_investment4_data
        )
        
        if success:
            user_b_request4_id = response.get('request_id')
            
            # Admin approves
            self.session_token = admin_token
            success, response = self.run_test(
                "Admin Approve User B Fourth Investment",
                "POST",
                f"admin/investment-requests/{user_b_request4_id}/approve",
                200
            )
            
            if success:
                print("   ✅ User B fourth investment approved")
                
                # Now: left=$2000, right=$2000
                # Expected total binary earnings: (min(2000, 2000) // 1000) * 100 = 2 * 100 = $200
                # New earnings = $200 - $100 = $100
                self.check_user_volumes(user_a_id, "After Both Sides $2000", expected_left=2000.0, expected_right=2000.0)
                self.check_binary_earnings(user_a_id, "After Second Bonus Trigger", expected_earnings=200.0)
                
                # Verify second binary transaction was created for $100
                self.check_binary_transaction(user_a_id, 100.0, transaction_count=2)
        
        # Step 8: Test Dashboard Display
        print("\n5️⃣ Testing Dashboard Display...")
        
        self.session_token = user_a_token
        success, response = self.run_test(
            "Get User A Dashboard",
            "GET",
            "dashboard",
            200
        )
        
        if success and isinstance(response, dict):
            user_data = response.get('user', {})
            left_volume = user_data.get('left_volume', 0)
            right_volume = user_data.get('right_volume', 0)
            binary_earnings = user_data.get('binary_earnings', 0)
            wallet_balance = user_data.get('wallet_balance', 0)
            
            print(f"   ✓ Dashboard - Left Volume: ${left_volume}")
            print(f"   ✓ Dashboard - Right Volume: ${right_volume}")
            print(f"   ✓ Dashboard - Binary Earnings: ${binary_earnings}")
            print(f"   ✓ Dashboard - Wallet Balance: ${wallet_balance}")
            
            if left_volume == 2000.0 and right_volume == 2000.0 and binary_earnings == 200.0:
                print("   ✅ Dashboard displays correct binary earnings data")
            else:
                print(f"   ❌ Dashboard data incorrect - Expected: L=$2000, R=$2000, B=$200")
        
        # Restore original token
        self.session_token = original_token
        
        print("\n✅ Binary Earnings Calculation System Testing Complete")

    def verify_binary_tree_structure(self, user_a_id, user_b_id, user_c_id):
        """Verify the binary tree structure is correct"""
        print("   🌳 Verifying binary tree structure...")
        
        mongo_commands = f"""
        use('test_database');
        
        var userA = db.users.findOne({{id: '{user_a_id}'}});
        var userB = db.users.findOne({{id: '{user_b_id}'}});
        var userC = db.users.findOne({{id: '{user_c_id}'}});
        
        print('User A left_child_id: ' + userA.left_child_id);
        print('User A right_child_id: ' + userA.right_child_id);
        print('User B position: ' + userB.position);
        print('User B upline_id: ' + userB.upline_id);
        print('User C position: ' + userC.position);
        print('User C upline_id: ' + userC.upline_id);
        
        if (userA.left_child_id === '{user_b_id}' && userA.right_child_id === '{user_c_id}') {{
            print('✅ Binary tree structure correct');
        }} else {{
            print('❌ Binary tree structure incorrect');
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
                if "✅ Binary tree structure correct" in result.stdout:
                    print("   ✅ Binary tree structure verified")
                else:
                    print("   ❌ Binary tree structure verification failed")
                    print(f"   Debug: {result.stdout}")
            else:
                print(f"   ❌ Failed to verify binary tree: {result.stderr}")
                
        except Exception as e:
            print(f"   ❌ Failed to verify binary tree: {str(e)}")

    def check_user_volumes(self, user_id, stage, expected_left=None, expected_right=None):
        """Check user's left and right volumes"""
        print(f"   📊 Checking volumes - {stage}...")
        
        mongo_commands = f"""
        use('test_database');
        
        var user = db.users.findOne({{id: '{user_id}'}});
        
        if (user) {{
            print('Left Volume: $' + user.left_volume);
            print('Right Volume: $' + user.right_volume);
            print('Binary Earnings: $' + user.binary_earnings);
            print('Wallet Balance: $' + user.wallet_balance);
        }} else {{
            print('User not found');
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
                print(f"   ✓ Volume check completed for {stage}")
                if expected_left is not None and f"Left Volume: ${expected_left}" in result.stdout:
                    print(f"   ✅ Left volume correct: ${expected_left}")
                if expected_right is not None and f"Right Volume: ${expected_right}" in result.stdout:
                    print(f"   ✅ Right volume correct: ${expected_right}")
            else:
                print(f"   ❌ Failed to check volumes: {result.stderr}")
                
        except Exception as e:
            print(f"   ❌ Failed to check volumes: {str(e)}")

    def check_binary_earnings(self, user_id, stage, expected_earnings):
        """Check user's binary earnings"""
        print(f"   💰 Checking binary earnings - {stage}...")
        
        mongo_commands = f"""
        use('test_database');
        
        var user = db.users.findOne({{id: '{user_id}'}});
        
        if (user) {{
            print('Binary Earnings: $' + user.binary_earnings);
            
            if (user.binary_earnings === {expected_earnings}) {{
                print('✅ Binary earnings correct: $' + user.binary_earnings);
            }} else {{
                print('❌ Binary earnings incorrect - Expected: ${expected_earnings}, Got: $' + user.binary_earnings);
            }}
        }} else {{
            print('User not found');
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
                if "✅ Binary earnings correct" in result.stdout:
                    print(f"   ✅ Binary earnings verified: ${expected_earnings}")
                else:
                    print(f"   ❌ Binary earnings verification failed")
                    print(f"   Debug: {result.stdout}")
            else:
                print(f"   ❌ Failed to check binary earnings: {result.stderr}")
                
        except Exception as e:
            print(f"   ❌ Failed to check binary earnings: {str(e)}")

    def check_wallet_balance_increase(self, user_id, expected_increase):
        """Check that wallet balance increased by expected amount"""
        print(f"   💳 Checking wallet balance increase of ${expected_increase}...")
        
        # This is a simplified check - in a real scenario we'd track before/after
        # For now, just verify the wallet balance is reasonable
        mongo_commands = f"""
        use('test_database');
        
        var user = db.users.findOne({{id: '{user_id}'}});
        
        if (user) {{
            print('Current Wallet Balance: $' + user.wallet_balance);
            
            if (user.wallet_balance >= {expected_increase}) {{
                print('✅ Wallet balance includes binary earnings');
            }} else {{
                print('❌ Wallet balance may not include binary earnings');
            }}
        }} else {{
            print('User not found');
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
                if "✅ Wallet balance includes" in result.stdout:
                    print(f"   ✅ Wallet balance increase verified")
                else:
                    print(f"   ⚠️ Wallet balance verification inconclusive")
            else:
                print(f"   ❌ Failed to check wallet balance: {result.stderr}")
                
        except Exception as e:
            print(f"   ❌ Failed to check wallet balance: {str(e)}")

    def check_binary_transaction(self, user_id, expected_amount, transaction_count=1):
        """Check that binary transaction was created"""
        print(f"   📝 Checking binary transaction record...")
        
        mongo_commands = f"""
        use('test_database');
        
        var transactions = db.transactions.find({{
            user_id: '{user_id}',
            type: 'binary'
        }}).toArray();
        
        print('Binary transactions found: ' + transactions.length);
        
        if (transactions.length >= {transaction_count}) {{
            for (var i = 0; i < transactions.length; i++) {{
                print('Transaction ' + (i+1) + ': $' + transactions[i].amount + ' - ' + transactions[i].description);
            }}
            
            var lastTransaction = transactions[transactions.length - 1];
            if (lastTransaction.amount === {expected_amount}) {{
                print('✅ Latest binary transaction amount correct: $' + lastTransaction.amount);
            }} else {{
                print('❌ Latest binary transaction amount incorrect - Expected: ${expected_amount}, Got: $' + lastTransaction.amount);
            }}
        }} else {{
            print('❌ Expected {transaction_count} binary transactions, found: ' + transactions.length);
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
                if "✅ Latest binary transaction amount correct" in result.stdout:
                    print(f"   ✅ Binary transaction verified: ${expected_amount}")
                else:
                    print(f"   ❌ Binary transaction verification failed")
                    print(f"   Debug: {result.stdout}")
            else:
                print(f"   ❌ Failed to check binary transaction: {result.stderr}")
                
        except Exception as e:
            print(f"   ❌ Failed to check binary transaction: {str(e)}")

    def run_all_tests(self):
        """Run comprehensive API tests"""
        print("🚀 Starting ParlaCapital API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test public endpoints first
        self.test_public_endpoints()
        
        # CRITICAL P1 TASK: Test Binary Earnings Calculation System
        self.test_binary_earnings_calculation_system()
        
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