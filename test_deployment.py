#!/usr/bin/env python3
"""
Test script to verify Vercel deployment setup
"""
import sys
import os

def test_imports():
    """Test that all required imports work"""
    print("Testing imports...")

    try:
        # Add the current directory to Python path
        sys.path.insert(0, os.path.dirname(__file__))

        # Test Flask app import
        from Project_of_IS.app import app
        print("[PASS] Flask app imported successfully")

        # Test Vercel blob imports (optional)
        try:
            from vercel.blob import put, get, delete
            print("[PASS] Vercel blob storage available")
        except ImportError:
            print("[INFO] Vercel blob storage not available (expected in local environment)")

        return True
    except Exception as e:
        print(f"[FAIL] Import error: {e}")
        return False

def test_app_initialization():
    """Test that the Flask app initializes correctly"""
    print("\nTesting app initialization...")

    try:
        from Project_of_IS.app import app

        with app.test_client() as client:
            # Test health endpoint
            response = client.get('/health')
            if response.status_code == 200:
                print("[PASS] Health endpoint working")
                return True
            else:
                print(f"[FAIL] Health endpoint failed: {response.status_code}")
                return False
    except Exception as e:
        print(f"[FAIL] App initialization error: {e}")
        return False

def test_vercel_handler():
    """Test that the Vercel handler can be imported"""
    print("\nTesting Vercel handler...")

    try:
        from api.index import handler
        print("[PASS] Vercel handler imported successfully")
        return True
    except Exception as e:
        print(f"[FAIL] Vercel handler import error: {e}")
        return False

if __name__ == "__main__":
    print("Vercel Deployment Test Suite")
    print("=" * 30)

    all_passed = True

    all_passed &= test_imports()
    all_passed &= test_app_initialization()
    all_passed &= test_vercel_handler()

    print("\n" + "=" * 30)
    if all_passed:
        print("[PASS] All tests passed! Ready for deployment.")
    else:
        print("[FAIL] Some tests failed. Please fix the issues before deploying.")

    sys.exit(0 if all_passed else 1)
