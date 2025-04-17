from .db import con

def get_user(id):
    with con.cursor() as cursor:
        cursor.execute("SELECT * FROM User WHERE id=%s", (id,))
        return cursor.fetchall()

# 아이디 중복 확인
def get_user_by_id(userid):
    with con.cursor() as cursor:
        cursor.execute("SELECT * FROM User WHERE id = %s", (userid,))
        return cursor.fetchone()

# 회원 추가
def add_user(usertype, userid, password, username, zipcode, addr, addr_detail, tel, phone, email):
    with con.cursor() as cursor:
        cursor.execute("""
            INSERT INTO User (
                usertype, id, password, username,
                zipcode, addr, addr_detail, tel, phone, email
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (usertype, userid, password, username,
              zipcode, addr, addr_detail, tel, phone, email))
        con.commit()

# 기본적인 이메일 형식
def is_valid_email(email):
    return bool(re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email))
