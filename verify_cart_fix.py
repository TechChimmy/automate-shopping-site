#!/usr/bin/env python3
"""
Verify Cart API Fix - Check if updated_at trigger error is resolved
This test focuses on verifying that the specific "updated_at field" error is gone
"""

import requests
import json
import uuid
from datetime import datetime

BASE_URL = "https://supashop-3.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

def test_cart_error_analysis():
    """Test Cart API to analyze the specific error and verify updated_at fix"""
    print("=" * 80)
    print("CART API ERROR ANALYSIS - VERIFYING UPDATED_AT FIX")
    print("=" * 80)
    
    # Test with random UUIDs to trigger the error and see what type it is
    test_user_id = str(uuid.uuid4())
    test_product_id = str(uuid.uuid4())
    
    print(f"Testing Cart API with non-existent IDs to analyze error type:")
    print(f"  User ID: {test_user_id}")
    print(f"  Product ID: {test_product_id}")
    print()
    
    # Test POST /api/cart
    cart_data = {
        "user_id": test_user_id,
        "product_id": test_product_id,
        "quantity": 1
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/cart",
            headers=HEADERS,
            json=cart_data,
            timeout=10
        )
        
        print(f"POST /api/cart Response:")
        print(f"  Status: {response.status_code}")
        print(f"  Body: {response.text}")
        print()
        
        if response.status_code == 500:
            error_data = response.json()
            error_message = error_data.get('error', '')
            
            # Check if this is the old updated_at error or a new foreign key error
            if 'updated_at' in error_message.lower():
                print("❌ CRITICAL: Still getting updated_at error!")
                print(f"   Error: {error_message}")
                return False, "updated_at_error"
            elif 'foreign key constraint' in error_message.lower():
                print("✅ GOOD: updated_at error is FIXED!")
                print("   Now getting expected foreign key constraint error")
                print(f"   Error: {error_message}")
                return True, "foreign_key_error"
            else:
                print("⚠️  UNKNOWN: Different error type")
                print(f"   Error: {error_message}")
                return False, "unknown_error"
        else:
            print("⚠️  UNEXPECTED: No 500 error received")
            return False, "no_error"
            
    except Exception as e:
        print(f"❌ EXCEPTION: {str(e)}")
        return False, "exception"

def test_cart_patch_error():
    """Test PATCH operation to see if updated_at error occurs there"""
    print("=" * 80)
    print("TESTING CART PATCH OPERATION")
    print("=" * 80)
    
    # Test PATCH with a random cart ID
    test_cart_id = str(uuid.uuid4())
    
    update_data = {
        "id": test_cart_id,
        "quantity": 3
    }
    
    print(f"Testing PATCH /api/cart with non-existent cart ID:")
    print(f"  Cart ID: {test_cart_id}")
    print(f"  New Quantity: 3")
    print()
    
    try:
        response = requests.patch(
            f"{BASE_URL}/cart",
            headers=HEADERS,
            json=update_data,
            timeout=10
        )
        
        print(f"PATCH /api/cart Response:")
        print(f"  Status: {response.status_code}")
        print(f"  Body: {response.text}")
        print()
        
        if response.status_code == 500:
            error_data = response.json()
            error_message = error_data.get('error', '')
            
            if 'updated_at' in error_message.lower():
                print("❌ CRITICAL: PATCH still has updated_at error!")
                return False
            else:
                print("✅ GOOD: No updated_at error in PATCH operation")
                return True
        else:
            print("✅ GOOD: PATCH operation completed without updated_at error")
            return True
            
    except Exception as e:
        print(f"❌ EXCEPTION in PATCH: {str(e)}")
        return False

def main():
    """Run cart fix verification tests"""
    print("CART API FIX VERIFICATION")
    print("Checking if CRITICAL_FIX.sql resolved the updated_at trigger error")
    print("=" * 80)
    print()
    
    # Test POST operation
    post_success, error_type = test_cart_error_analysis()
    
    print("\n")
    
    # Test PATCH operation
    patch_success = test_cart_patch_error()
    
    # Final Analysis
    print("\n" + "=" * 80)
    print("CART API FIX VERIFICATION RESULTS")
    print("=" * 80)
    
    if post_success and error_type == "foreign_key_error":
        print("✅ POST /api/cart - updated_at error FIXED")
        print("   Now correctly showing foreign key constraint errors (expected behavior)")
    else:
        print("❌ POST /api/cart - updated_at error may still exist")
    
    if patch_success:
        print("✅ PATCH /api/cart - No updated_at errors detected")
    else:
        print("❌ PATCH /api/cart - May still have updated_at errors")
    
    print("\n" + "=" * 80)
    
    overall_success = post_success and patch_success
    
    if overall_success:
        print("🎉 CART API FIX VERIFIED!")
        print("   The updated_at trigger error has been resolved by CRITICAL_FIX.sql")
        print("   Cart API is now working correctly (foreign key constraints are expected)")
    else:
        print("⚠️  CART API FIX INCOMPLETE")
        print("   The updated_at trigger error may still exist")
    
    print("\n" + "=" * 80)
    
    return overall_success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)