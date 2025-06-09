from db.db import get_connection

def get_rank_my(user_id):
    with get_connection().cursor() as cursor:
        cursor.execute("SELECT * FROM (SELECT id, username, point, RANK() OVER (ORDER BY point DESC) AS `rank` FROM User) ranked WHERE id = %s;", (user_id,))
        return cursor.fetchone()
        
def get_rank_top5():
    with get_connection().cursor() as cursor:
        cursor.execute("SELECT * FROM (SELECT id, username, point, RANK() OVER (ORDER BY point DESC) AS `rank` FROM User) ranked WHERE `rank` <=5;")
        return cursor.fetchall()
    
def get_rank_all():
    with get_connection().cursor() as cursor:
        cursor.execute("SELECT id, username, point, RANK() OVER (ORDER BY point DESC) AS `rank` FROM User;")
        return cursor.fetchall()