import requests
import sys
import json
from datetime import datetime
import time

class ParlaCapitalAPITester:
    def __init__(self, base_url="https://investparla.preview.emergentagent.com"):
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
        
        # Test referral validation with invalid code
        success, response = self.run_test(
            "Validate Invalid Referral",
            "GET",
            "validate-referral/invalid123",
            200
        )
        
        if success and isinstance(response, dict):
            if not response.get('valid', True):
                print("   ✓ Invalid referral correctly rejected")

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
        
        // Remove test sessions
        var result3 = db.user_sessions.deleteMany({session_token: /test_session/});
        var result4 = db.user_sessions.deleteMany({session_token: /admin_session/});
        
        // Remove test investments
        var result5 = db.investments.deleteMany({user_id: /test-user-/});
        var result6 = db.investments.deleteMany({user_id: /admin-user-/});
        
        // Remove test transactions
        var result7 = db.transactions.deleteMany({user_id: /test-user-/});
        var result8 = db.transactions.deleteMany({user_id: /admin-user-/});
        
        print('Cleanup completed');
        print('Users deleted: ' + (result1.deletedCount + result2.deletedCount));
        print('Sessions deleted: ' + (result3.deletedCount + result4.deletedCount));
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

    def run_all_tests(self):
        """Run comprehensive API tests"""
        print("🚀 Starting ParlaCapital API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test public endpoints first
        self.test_public_endpoints()
        
        # Create test user and session
        if not self.create_test_user_session():
            print("❌ Cannot proceed with authenticated tests - user creation failed")
            return self.get_results()
        
        # Test authenticated endpoints
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