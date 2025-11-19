#!/usr/bin/env python3
"""
Focused Cart API Test - Testing with different approaches to verify the updated_at fix
"""

import requests
import json
import uuid
from datetime import datetime

BASE_URL = "https://supashop-3.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

def test_cart_with_existing_user():
    """Test Cart API by first creating a user, then testing cart operations"""
    print("=" * 60)
    print("TESTING CART API WITH USER CREATION APPROACH")
    print("=" * 60)
    
    # Step 1: Try to register a user first
    test_email = f"carttest_{uuid.uuid4().hex[:8]}@example.com"
    register_data = {
        "email": test_email,
        "password": "testpassword123"
    }
    
    print(f"Step 1: Creating user with email: {test_email}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            headers=HEADERS,
            json=register_data,
            timeout=10
        )
        
        print(f"Registration Response Status: {response.status_code}")
        print(f"Registration Response: {response.text}")
        
        if response.status_code == 200:
            user_data = response.json()
            if user_data.get('success') and user_data.get('user'):
                user_id = user_data['user'].get('id')
                print(f"✅ User created successfully with ID: {user_id}")
                
                # Step 2: Test Cart API with valid user ID
                return test_cart_operations(user_id)
            else:
                print(f"❌ User registration failed: {user_data}")
                return False
        else:
            print(f"❌ Registration failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Exception during user registration: {str(e)}")
        return False

def test_cart_operations(user_id):
    """Test cart operations with a valid user ID"""
    print(f"\nStep 2: Testing Cart operations with User ID: {user_id}")
    
    test_product_id = str(uuid.uuid4())
    
    # Test 1: POST - Add item to cart
    try:
        cart_data = {
            "user_id": user_id,
            "product_id": test_product_id,
            "quantity": 1
        }
        
        print(f"\nTesting POST /api/cart with:")
        print(f"  User ID: {user_id}")
        print(f"  Product ID: {test_product_id}")
        print(f"  Quantity: 1")
        
        response = requests.post(
            f"{BASE_URL}/cart",
            headers=HEADERS,
            json=cart_data,
            timeout=10
        )
        
        print(f"\nPOST Response Status: {response.status_code}")
        print(f"POST Response Body: {response.text}")
        
        if response.status_code == 200:
            response_data = response.json()
            if response_data.get('data'):
                cart_item_id = response_data['data'].get('id')
                print(f"✅ Cart item added successfully. Cart ID: {cart_item_id}")
                
                # Test 2: PATCH - Update quantity
                return test_cart_update(cart_item_id)
            else:
                print(f"❌ No data in POST response: {response_data}")
                return False
        else:
            print(f"❌ POST failed with status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception during cart POST: {str(e)}")
        return False

def test_cart_update(cart_item_id):
    """Test cart quantity update (PATCH operation)"""
    print(f"\nStep 3: Testing PATCH /api/cart with Cart ID: {cart_item_id}")
    
    try:
        update_data = {
            "id": cart_item_id,
            "quantity": 3
        }
        
        print(f"Updating quantity to: 3")
        
        response = requests.patch(
            f"{BASE_URL}/cart",
            headers=HEADERS,
            json=update_data,
            timeout=10
        )
        
        print(f"\nPATCH Response Status: {response.status_code}")
        print(f"PATCH Response Body: {response.text}")
        
        if response.status_code == 200:
            response_data = response.json()
            if response_data.get('data'):
                new_qty = response_data['data'].get('qty')
                print(f"✅ Cart quantity updated successfully to: {new_qty}")
                return True
            else:
                print(f"❌ No data in PATCH response: {response_data}")
                return False
        else:
            print(f"❌ PATCH failed with status {response.status_code}: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception during cart PATCH: {str(e)}")
        return False

def main():
    """Run focused cart API test"""
    print("FOCUSED CART API TEST - VERIFYING UPDATED_AT FIX")
    print("=" * 80)
    print()
    
    success = test_cart_with_existing_user()
    
    print("\n" + "=" * 80)
    print("CART API TEST RESULTS")
    print("=" * 80)
    
    if success:
        print("✅ Cart API - Working correctly (updated_at trigger fix successful)")
        print("   Both POST and PATCH operations completed successfully")
    else:
        print("❌ Cart API - Still has issues")
        print("   Check the detailed output above for specific errors")
    
    print("\n" + "=" * 80)
    
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)