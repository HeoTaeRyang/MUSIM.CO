import re

def is_valid_id(user_id):
    return re.match("^[a-z0-9]{4,16}$", user_id)

def is_valid_password(password):
    if not 10 <= len(password) <= 16:
        return False

    count = 0
    if re.search("[a-zA-Z]", password):  # 영문 포함
        count += 1
    if re.search("[0-9]", password):     # 숫자 포함
        count += 1
    if re.search("[!@#$%^&*]", password):  # 특수문자 포함
        count += 1

    return count >= 2
def is_valid_email(email):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email)
