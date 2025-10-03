import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Gift shop - list gifts and purchase with currency
    Args: event with httpMethod (GET/POST), body with user_id, gift_id
    Returns: HTTP response with gifts list or purchase result
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            user_id = params.get('user_id')
            
            if user_id:
                cur.execute("""
                    SELECT g.id, g.name, g.description, g.price, g.icon, g.category, ug.purchased_at
                    FROM gifts g
                    LEFT JOIN user_gifts ug ON g.id = ug.gift_id AND ug.user_id = %s
                    ORDER BY g.id
                """, (user_id,))
            else:
                cur.execute("SELECT id, name, description, price, icon, category FROM gifts ORDER BY id")
            
            gifts = []
            for row in cur.fetchall():
                gift = {
                    'id': row[0],
                    'name': row[1],
                    'description': row[2],
                    'price': row[3],
                    'icon': row[4],
                    'category': row[5]
                }
                if user_id and len(row) > 6:
                    gift['purchased'] = row[6] is not None
                gifts.append(gift)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'gifts': gifts})
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action', 'purchase')
            
            if action == 'add_gift':
                admin_username = body_data.get('admin_username')
                name = body_data.get('name')
                description = body_data.get('description')
                price = body_data.get('price')
                icon = body_data.get('icon', 'Gift')
                category = body_data.get('category', 'general')
                
                if not admin_username:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Admin access required'})
                    }
                
                cur.execute("SELECT is_admin FROM users WHERE username = %s", (admin_username,))
                admin_check = cur.fetchone()
                if not admin_check or not admin_check[0]:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Access denied'})
                    }
                
                cur.execute(
                    "INSERT INTO gifts (name, description, price, icon, category) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                    (name, description, price, icon, category)
                )
                gift_id = cur.fetchone()[0]
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'success': True,
                        'gift_id': gift_id,
                        'message': 'Gift added successfully'
                    })
                }
            
            user_id = body_data.get('user_id')
            gift_id = body_data.get('gift_id')
            
            if not user_id or not gift_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'user_id and gift_id required'})
                }
            
            cur.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
            user_row = cur.fetchone()
            if not user_row:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'User not found'})
                }
            
            balance = user_row[0]
            
            cur.execute("SELECT price FROM gifts WHERE id = %s", (gift_id,))
            gift_row = cur.fetchone()
            if not gift_row:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Gift not found'})
                }
            
            price = gift_row[0]
            
            if balance < price:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Insufficient balance'})
                }
            
            cur.execute(
                "SELECT id FROM user_gifts WHERE user_id = %s AND gift_id = %s",
                (user_id, gift_id)
            )
            if cur.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Gift already purchased'})
                }
            
            new_balance = balance - price
            cur.execute("UPDATE users SET balance = %s WHERE id = %s", (new_balance, user_id))
            cur.execute(
                "INSERT INTO user_gifts (user_id, gift_id) VALUES (%s, %s)",
                (user_id, gift_id)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({
                    'success': True,
                    'new_balance': new_balance
                })
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    finally:
        cur.close()
        conn.close()