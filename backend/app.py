from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash
from db import user
from utils import is_valid_id, is_valid_password, is_valid_email

app = Flask(__name__)
CORS(app)

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    # 필수 입력값 추출
    usertype = data.get('usertype')
    userid = data.get('id')
    password = data.get('password')
    password_confirm = data.get('password_confirm')
    username = data.get('username')
    addr = data.get('addr')
    zipcode = data.get('zipcode')
    phone = data.get('phone')
    email = data.get('email')

    # 선택 입력값
    addr_detail = data.get('addr_detail', '')
    tel = data.get('tel', '')

    # ✅ 필수 항목 누락 검사 (명시적으로 알려줌)
    required_fields = {
        "usertype": usertype,
        "id": userid,
        "password": password,
        "password_confirm": password_confirm,
        "username": username,
        "addr": addr,
        "zipcode": zipcode,
        "phone": phone,
        "email": email
    }
    missing = [field for field, value in required_fields.items() if not value]
    if missing:
        return jsonify({'error': f"다음 항목을 입력하세요: {', '.join(missing)}"}), 400

    # ✅ 아이디 유효성
    if not is_valid_id(userid):
        return jsonify({'error': '아이디는 영문소문자/숫자 4~16자입니다.'}), 400

    # ✅ 아이디 중복 확인
    if user.get_user_by_id(userid):
        return jsonify({'error': '이미 존재하는 아이디입니다.'}), 400

    # ✅ 비밀번호 일치 확인
    if password != password_confirm:
        return jsonify({'error': '비밀번호가 일치하지 않습니다.'}), 400

    # ✅ 비밀번호 유효성
    if not is_valid_password(password):
        return jsonify({'error': '비밀번호는 영문 대소문자/숫자/특수문자 중 2가지 이상을 포함한 10~16자입니다.'}), 400

    # ✅ 이메일 유효성
    if not is_valid_email(email):
        return jsonify({'error': '이메일 형식이 올바르지 않습니다.'}), 400

    # 🔐 비밀번호 해싱
    hashed_pw = generate_password_hash(password)

    # ✅ DB에 사용자 추가
    try:
        user.add_user(usertype, userid, hashed_pw, username, zipcode, addr, addr_detail, tel, phone, email)
    except Exception as e:
        return jsonify({'error': f'DB 오류: {str(e)}'}), 500

    return jsonify({'message': '회원가입 성공!'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
