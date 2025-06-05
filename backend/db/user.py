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

def check_attendance(user_id, today):
    with get_connection().cursor() as cursor:
        cursor.execute("SELECT * FROM Attendance WHERE id = %s AND date =  %s", (user_id, today))
        return cursor.fetchone()

def add_attendance(user_id, today):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO Attendance (id, date) VALUES (%s, %s)", (user_id, today))
            conn.commit()
    
def add_point(user_id):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE User SET point = point + 50 WHERE id = %s", (user_id))
            conn.commit()
            
def get_attendance_month(user_id, year, month):
    with get_connection().cursor() as cursor:
        cursor.execute("SELECT date FROM Attendance WHERE id = %s AND YEAR(date) = %s AND MONTH(date) = %s", (user_id, year, month))
        rows = cursor.fetchall()
        return [row['date'] for row in rows]
    
def daily_mission_exists(user_id, today):
    with get_connection().cursor() as cursor:
        cursor.execute("SELECT * FROM DailyMission WHERE user_id = %s AND date = %s", (user_id, today))
        return cursor.fetchone()
    
def save_daily_mission(user_id, today):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO DailyMission (user_id, date) VALUES (%s, %s)", (user_id, today))
            conn.commit()