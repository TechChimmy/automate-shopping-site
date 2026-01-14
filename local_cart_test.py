
import requests
import uuid
import json
import time

BASE_URL = "http://localhost:3000/api"
HEADERS = {"Content-Type": "application/json"}

def test_cart():
    print(f"Testing against {BASE_URL}")
    
    user_id = str(uuid.uuid4())
    product_id = str(uuid.uuid4())
    
    print(f"User ID: {user_id}")
    print(f"Product ID: {product_id}")
    
    # 1. Add to cart
    print("1. Adding to cart...")
    try:
        res = requests.post(f"{BASE_URL}/cart", json={
            "user_id": user_id,
            "product_id": product_id,
            "quantity": 1
        }, headers=HEADERS)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")
        
        if res.status_code != 200:
            print("Failed to add to cart")
            return
            
        data = res.json().get('data')
        cart_id = data['id']
        print(f"Added. Cart ID: {cart_id}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_cart()
