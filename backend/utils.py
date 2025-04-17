import re

def is_valid_id(user_id):
    return re.match("^[a-z0-9]{4,16}$", user_id)

def is_valid_password(password):
    return len(password) >= 10 and len(password) <= 16 and \
           (re.search("[a-zA-Z]", password) and re.search("[0-9]", password) or \
            re.search("[a-zA-Z]", password) and re.search("[!@#$%^&*]", password) or \
            re.search("[0-9]", password) and re.search("[!@#$%^&*]", password))

def is_valid_email(email):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email)
