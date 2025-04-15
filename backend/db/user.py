from db.connect import con

def get_user(id):
    with con.cursor() as cursor:
        cursor.execute("SELECT * FROM User WHERE ID=%s", (id,))
        return cursor.fetchall()