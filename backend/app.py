from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import check_password_hash

from db import user

app = Flask(__name__)
CORS(app)

# 백엔드 서버 실행 확인
@app.route('/')
def index():
    return "백엔드 서버 실행 중입니다."

# 로그인
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    id = data.get("id")
    password = data.get("password")
    
    db_id = user.get_user(id)
    
    if not db_id:
        return jsonify({'error': '존재하지 않는 아이디 입니다.'}), 401
    
    db_password = db_id[0]['password']
    
    if not check_password_hash(db_password, password):
        return jsonify({'error': '잘못된 비밀번호 입니다.'}), 401
    
    return jsonify({'message': '로그인 되었습니다.'}), 200
    
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)