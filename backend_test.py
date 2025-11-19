#!/usr/bin/env python3
"""
Backend API Test - Critical Fix Verification
Testing Orders and Cart APIs after CRITICAL_FIX.sql execution

FOCUS: Only testing the two APIs that were fixed by CRITICAL_FIX.sql:
1. Orders API (POST /api/orders) - product_id column fix
2. Cart API (POST /api/cart, PATCH /api/cart) - updated_at trigger fix
"""

import requests
import json
import uuid
from datetime import datetime

# Configuration
BASE_URL = "https://supashop-3.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

def log_test(test_name, success, details=""):
    """Log test results with timestamp"""
    status = "✅ PASS" if success else "❌ FAIL"
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {status} {test_name}")
    if details:
        print(f"    Details: {details}")
    print()
def test_orders_api():
    """Test Orders API - POST operation to verify product_id column fix"""
    print("=" * 60)
    print("TESTING ORDERS API - POST /api/orders")
    print("=" * 60)
    
    try:
        # Generate test data
        test_user_id = str(uuid.uuid4())
        test_product_id = str(uuid.uuid4())
        
        # Test data for order creation
        order_data = {
            "user_id": test_user_id,
            "items": [
                {
                    "product_id": test_product_id,
                    "quantity": 2,
                    "total": 100.00
                }
            ],
            "total_amount": 100.00,
            "payment_method": "credit_card"
        }
        
        print(f"Testing order creation with:")
        print(f"  User ID: {test_user_id}")
        print(f"  Product ID: {test_product_id}")
        print(f"  Quantity: 2")
        print(f"  Total: $100.00")
        print()
        
        # Make POST request
        response = requests.post(
            f"{BASE_URL}/orders",
            headers=HEADERS,
            json=order_data,
            timeout=10
        )
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            response_data = response.json()
            if response_data.get('success'):
                log_test("Orders API - Order Creation", True, 
                        f"Order created successfully. Response: {response_data}")
                return True
            else:
                log_test("Orders API - Order Creation", False, 
                        f"API returned success=false: {response_data}")
                return False
        else:
            log_test("Orders API - Order Creation", False, 
                    f"HTTP {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        log_test("Orders API - Order Creation", False, f"Exception: {str(e)}")
        return False

def test_cart_api():
    """Test Cart API - POST and PATCH operations to verify updated_at fix"""
    print("=" * 60)
    print("TESTING CART API - POST and PATCH operations")
    print("=" * 60)
    
    test_user_id = str(uuid.uuid4())
    test_product_id = str(uuid.uuid4())
    cart_item_id = None
    
    # Test 1: POST - Add item to cart
    try:
        cart_data = {
            "user_id": test_user_id,
            "product_id": test_product_id,
            "quantity": 1
        }
        
        print(f"Testing cart item addition with:")
        print(f"  User ID: {test_user_id}")
        print(f"  Product ID: {test_product_id}")
        print(f"  Quantity: 1")
        print()
        
        response = requests.post(
            f"{BASE_URL}/cart",
            headers=HEADERS,
            json=cart_data,
            timeout=10
        )
        
        print(f"POST Response Status: {response.status_code}")
        print(f"POST Response Body: {response.text}")
        
        if response.status_code == 200:
            response_data = response.json()
            if response_data.get('data'):
                cart_item_id = response_data['data'].get('id')
                log_test("Cart API - Add Item (POST)", True, 
                        f"Item added successfully. Cart ID: {cart_item_id}")
                post_success = True
            else:
                log_test("Cart API - Add Item (POST)", False, 
                        f"No data in response: {response_data}")
                post_success = False
        else:
            log_test("Cart API - Add Item (POST)", False, 
                    f"HTTP {response.status_code}: {response.text}")
            post_success = False
            
    except Exception as e:
        log_test("Cart API - Add Item (POST)", False, f"Exception: {str(e)}")
        post_success = False
    
    # Test 2: PATCH - Update quantity (only if POST succeeded)
    if post_success and cart_item_id:
        try:
            update_data = {
                "id": cart_item_id,
                "quantity": 3
            }
            
            print(f"Testing cart quantity update with:")
            print(f"  Cart Item ID: {cart_item_id}")
            print(f"  New Quantity: 3")
            print()
            
            response = requests.patch(
                f"{BASE_URL}/cart",
                headers=HEADERS,
                json=update_data,
                timeout=10
            )
            
            print(f"PATCH Response Status: {response.status_code}")
            print(f"PATCH Response Body: {response.text}")
            
            if response.status_code == 200:
                response_data = response.json()
                if response_data.get('data'):
                    log_test("Cart API - Update Quantity (PATCH)", True, 
                            f"Quantity updated successfully: {response_data}")
                    patch_success = True
                else:
                    log_test("Cart API - Update Quantity (PATCH)", False, 
                            f"No data in response: {response_data}")
                    patch_success = False
            else:
                log_test("Cart API - Update Quantity (PATCH)", False, 
                        f"HTTP {response.status_code}: {response.text}")
                patch_success = False
                
        except Exception as e:
            log_test("Cart API - Update Quantity (PATCH)", False, f"Exception: {str(e)}")
            patch_success = False
    else:
        print("Skipping PATCH test - POST operation failed")
        patch_success = False
    
    return post_success and patch_success

# Removed other test functions - focusing only on Orders and Cart APIs

def main():
    """Run all critical API tests"""
    print("BACKEND API TESTING - CRITICAL FIX VERIFICATION")
    print("Testing Orders and Cart APIs after CRITICAL_FIX.sql execution")
    print("=" * 80)
    print()
    
    # Test Orders API
    orders_working = test_orders_api()
    
    print("\n" + "=" * 80 + "\n")
    
    # Test Cart API
    cart_working = test_cart_api()
    
    # Final Summary
    print("\n" + "=" * 80)
    print("FINAL TEST RESULTS")
    print("=" * 80)
    
    if orders_working:
        print("✅ Orders API - Working correctly (product_id column fix successful)")
    else:
        print("❌ Orders API - Still failing (product_id column issue persists)")
    
    if cart_working:
        print("✅ Cart API - Working correctly (updated_at trigger fix successful)")
    else:
        print("❌ Cart API - Still failing (updated_at trigger issue persists)")
    
    print("\n" + "=" * 80)
    
    if orders_working and cart_working:
        print("🎉 ALL CRITICAL FIXES VERIFIED - Both APIs working correctly!")
        return True
    else:
        print("⚠️  CRITICAL ISSUES REMAIN - Some APIs still failing")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)