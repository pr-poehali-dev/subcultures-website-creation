import json
import os
import psycopg2
from datetime import date
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Daily rewards system - claim daily coins bonus
    Args: event with httpMethod (GET/POST), body with user_id
    Returns: HTTP response with reward status or claim result
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
            user_id = params.get('user_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'user_id required'})
                }
            
            today = date.today()
            cur.execute(
                "SELECT last_claim_date FROM daily_rewards WHERE user_id = %s",
                (user_id,)
            )
            row = cur.fetchone()
            
            can_claim = True
            if row:
                last_claim = row[0]
                if last_claim >= today:
                    can_claim = False
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({
                    'can_claim': can_claim,
                    'reward_amount': 100
                })
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            user_id = body_data.get('user_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'user_id required'})
                }
            
            today = date.today()
            
            cur.execute(
                "SELECT last_claim_date FROM daily_rewards WHERE user_id = %s",
                (user_id,)
            )
            row = cur.fetchone()
            
            if row and row[0] >= today:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Already claimed today'})
                }
            
            reward_amount = 100
            
            cur.execute(
                "UPDATE users SET balance = balance + %s WHERE id = %s RETURNING balance",
                (reward_amount, user_id)
            )
            new_balance = cur.fetchone()[0]
            
            if row:
                cur.execute(
                    "UPDATE daily_rewards SET last_claim_date = %s WHERE user_id = %s",
                    (today, user_id)
                )
            else:
                cur.execute(
                    "INSERT INTO daily_rewards (user_id, last_claim_date) VALUES (%s, %s)",
                    (user_id, today)
                )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'isBase64Encoded': False,
                'body': json.dumps({
                    'success': True,
                    'reward_amount': reward_amount,
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
