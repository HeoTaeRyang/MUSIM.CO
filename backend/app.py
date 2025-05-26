from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
from db import user, video
from db.db import con
from db.video import get_video_by_id, toggle_favorite, add_recommendation
from db.comment import get_comments_by_video, add_comment
from db.posture import save_posture_result
from utils import is_valid_id, is_valid_password, is_valid_email

from ai.condition import evaluate
import cv2

app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 백엔드 서버 실행 확인
@app.route('/')
def index():
    return "백엔드 서버 실행 중입니다."

# ㅡㅡㅡㅡㅡ운동 영상 관련 api

@app.route('/video/today', methods=['GET'])
def video_today():
    video_data = video.get_random_video()
    if not video_data:
        return jsonify({'error': '추천 운동 영상이 없습니다.'}), 404
    return jsonify(video_data), 200

@app.route('/video/list', methods=['GET'])
def video_list():
    videos = video.get_random_videos()
    if not videos:
        return jsonify({'error': '운동 영상이 없습니다.'}), 404
    return jsonify(videos), 200

@app.route('/video/correctable', methods=['GET'])
def video_correctable():
    videos = video.get_correctable_videos()
    if not videos:
        return jsonify({'error': '자세 교정 영상이 없습니다.'}), 404
    return jsonify(videos), 200

@app.route('/video/favorite', methods=['POST'])
def video_favorite():
    data = request.get_json()
    user_id = data.get("id")
    videos = video.get_favorite_videos(user_id)
    if not videos:
        return jsonify({'error': '즐겨 찾기한 영상이 없습니다.'}), 404
    return jsonify(videos), 200

@app.route('/video/sort', methods=['POST'])
def video_sort():
    data = request.get_json()
    keyword = data.get("keyword")
    videos = video.get_sort_videos(keyword)
    return jsonify(videos), 200

@app.route('/video/search', methods=['POST'])
def video_search():
    data = request.get_json()
    keyword = data.get("keyword")
    videos = video.get_search_videos(keyword)
    if not videos:
        return jsonify({'error': '검색된 영상이 없습니다.'}), 404
    return jsonify(videos), 200

# ㅡㅡㅡㅡㅡ운동 상세 페이지 + 자세 교정 api

@app.route('/video/<int:video_id>', methods=['GET'])
def get_video(video_id):
    video_data = get_video_by_id(video_id)
    if not video_data:
        return jsonify({'error': 'Video not found'}), 404
    return jsonify(video_data), 200

@app.route('/video/<int:video_id>/favorite', methods=['POST'])
def favorite_video(video_id):
    data = request.get_json()
    user_id = data.get('user_id')
    toggle_favorite(user_id, video_id)
    return jsonify({'message': 'Favorite toggled'}), 200

@app.route('/video/<int:video_id>/recommend', methods=['POST'])
def recommend_video(video_id):
    data = request.get_json()
    user_id = data.get('user_id')
    add_recommendation(user_id, video_id)
    return jsonify({'message': 'Recommendation added'}), 200

@app.route('/video/<int:video_id>/comment', methods=['POST'])
def post_comment(video_id):
    data = request.get_json()
    user_id = data.get("user_id")
    content = data.get("content")
    comment = add_comment(video_id, user_id, content)
    return jsonify(comment), 201

@app.route('/video/<int:video_id>/comments', methods=['GET'])
def get_comments(video_id):
    sort = request.args.get("sort", "latest")
    comments = get_comments_by_video(video_id, sort)
    return jsonify(comments), 200

@app.route('/video/<int:video_id>/posture/upload', methods=['POST'])
def upload_posture_video(video_id):
    user_id = request.form.get("user_id")
    file = request.files.get("video_file")
    if not file:
        return jsonify({"error": "파일이 없습니다."}), 400
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    return jsonify({"message": "업로드 완료", "path": filepath}), 200

@app.route('/video/<int:video_id>/posture/analyze', methods=['POST'])
def analyze_posture(video_id):
    data = request.get_json()
    video_path = data.get("video_path")
    user_id = data.get("user_id")

    # 1. 영상에서 프레임 추출
    cap = cv2.VideoCapture(video_path)
    frames = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)
    cap.release()

    # 2. 모델 평가 (모델 경로는 예시)
    model_path = "backend/ai/1/1.pth"
    analysis_results = evaluate(frames, model_path=model_path, num_conditions=5)

    # 3. 실패 시 처리
    if isinstance(analysis_results, dict) and not analysis_results.get("valid", True):
        return jsonify(analysis_results), 400

    # 4. 결과 정리
    result_texts = []
    for res in analysis_results:
        if res["value"]:
            result_texts.append(f"Condition {res['condition']} 이상 감지 (score: {res['score']:.2f})")

    result_text = "\n".join(result_texts) if result_texts else "문제 없음"
    
    return jsonify({
        "result_text": result_text,
        "raw_result": analysis_results
    }), 200

@app.route('/video/<int:video_id>/posture/save', methods=['POST'])
def save_posture(video_id):
    data = request.get_json()
    user_id = data.get("user_id")
    result_text = data.get("result_text")
    image_url = data.get("image_url")
    result = save_posture_result(user_id, video_id, result_text, image_url)
    return jsonify(result), 201

@app.route('/video/<int:video_id>/posture/result', methods=['GET'])
def get_posture_result(video_id):
    user_id = request.args.get("user_id")
    with con.cursor() as cursor:
        cursor = con.cursor()
        cursor.execute("""
            SELECT * FROM PostureResult
            WHERE video_id = %s AND user_id = %s
            ORDER BY saved_at DESC LIMIT 1
        """, (video_id, user_id))
        return jsonify(cursor.fetchone()), 200



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

# 회원가입
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    usertype = data.get('usertype')
    userid = data.get('id')
    password = data.get('password')
    password_confirm = data.get('password_confirm')
    username = data.get('username')
    addr = data.get('addr')
    zipcode = data.get('zipcode')
    phone = data.get('phone')
    email = data.get('email')
    addr_detail = data.get('addr_detail', '')
    tel = data.get('tel', '')

    if usertype not in ['개인회원', '강사']:
        return jsonify({'error': '잘못된 회원 유형입니다.'}), 400

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

    if not is_valid_id(userid):
        return jsonify({'error': '아이디는 영문소문자/숫자 4~16자입니다.'}), 400
    if user.get_user_by_id(userid):
        return jsonify({'error': '이미 존재하는 아이디입니다.'}), 400
    if password != password_confirm:
        return jsonify({'error': '비밀번호가 일치하지 않습니다.'}), 400
    if not is_valid_password(password):
        return jsonify({'error': '비밀번호는 영문 대소문자/숫자/특수문자 중 2가지 이상을 포함한 10~16자입니다.'}), 400
    if not is_valid_email(email):
        return jsonify({'error': '이메일 형식이 올바르지 않습니다.'}), 400

    hashed_pw = generate_password_hash(password)
    try:
        user.add_user(usertype, userid, hashed_pw, username, zipcode, addr, addr_detail, tel, phone, email)
    except Exception as e:
        return jsonify({'error': f'DB 오류: {str(e)}'}), 500

    return jsonify({'message': '회원가입 성공!'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
