import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Admin panel operations - manage users, add coins, ban users, grant admin rights
    Args: event with httpMethod, body with action, admin_username, target_username, coins
    Returns: HTTP response with operation result
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
            params = event.get('queryStringParameters', {})
            admin_username = params.get('admin_username')
            
            if not admin_username:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Admin username required'})
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
            
            cur.execute("SELECT id, username, password, balance, is_admin, is_banned, created_at FROM users ORDER BY id")
            users = cur.fetchall()
            
            users_list = [{
                'id': u[0],
                'username': u[1],
                'password': u[2],
                'balance': u[3],
                'is_admin': u[4],
                'is_banned': u[5],
                'created_at': str(u[6])
            } for u in users]
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({'users': users_list})
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            admin_username = body_data.get('admin_username')
            target_username = body_data.get('target_username')
            
            if not admin_username:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Admin username required'})
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
            
            if action == 'add_coins':
                coins = body_data.get('coins', 0)
                
                if not target_username or not isinstance(coins, int):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Invalid parameters'})
                    }
                
                cur.execute(
                    "UPDATE users SET balance = balance + %s WHERE username = %s RETURNING balance",
                    (coins, target_username)
                )
                result = cur.fetchone()
                conn.commit()
                
                if not result:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'User not found'})
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'success': True,
                        'message': f'Added {coins} coins to {target_username}',
                        'new_balance': result[0]
                    })
                }
            
            elif action == 'ban_user':
                ban_status = body_data.get('ban', True)
                
                if not target_username:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Target username required'})
                    }
                
                cur.execute(
                    "UPDATE users SET is_banned = %s WHERE username = %s RETURNING username",
                    (ban_status, target_username)
                )
                result = cur.fetchone()
                conn.commit()
                
                if not result:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'User not found'})
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'success': True,
                        'message': f'User {target_username} {"banned" if ban_status else "unbanned"}'
                    })
                }
            
            elif action == 'grant_admin':
                admin_status = body_data.get('grant', True)
                
                if not target_username:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Target username required'})
                    }
                
                cur.execute(
                    "UPDATE users SET is_admin = %s WHERE username = %s RETURNING username",
                    (admin_status, target_username)
                )
                result = cur.fetchone()
                conn.commit()
                
                if not result:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'User not found'})
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'success': True,
                        'message': f'Admin rights {"granted to" if admin_status else "revoked from"} {target_username}'
                    })
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Invalid action'})
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
