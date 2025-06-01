import re
from db.db import get_connection

def get_user(id):
    with get_connection().cursor() as cursor:
        cursor.execute("SELECT * FROM User WHERE id=%s", (id,))
        return cursor.fetchall()

def get_user_by_id(userid):
    with get_connection().cursor() as cursor:
        cursor.execute("SELECT * FROM User WHERE id = %s", (userid,))
        return cursor.fetchone()

def add_user(usertype, userid, password, username, zipcode, addr, addr_detail, tel, phone, email):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO User (
                    usertype, id, password, username,
                    zipcode, addr, addr_detail, tel, phone, email
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (usertype, userid, password, username,
                  zipcode, addr, addr_detail, tel, phone, email))
            conn.commit()

def is_valid_email(email):
    return bool(re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email))
