from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import cv2
import uuid
import base64
import io
import boto3
from datetime import date
import numpy as np

from pathlib import Path
from ai import daily
from db import user, video, rank, comment
from db.db import get_connection
from db.video import get_video_by_id, toggle_favorite, add_recommendation
from db.comment import get_comments_by_video, add_comment
from db.posture import save_posture_result
from utils import is_valid_id, is_valid_password, is_valid_email
from ai.condition import evaluate
from utils import read_video_to_frames, save_result_video

BASE_DIR = Path(__file__).resolve().parent

def abs_model_path(rel_path: str) -> str:
    return str(BASE_DIR / rel_path)

app = Flask(__name__)

# [수정] 배포 환경에 맞게 CORS 설정을 구체화합니다.
# 로컬 개발(localhost)과 배포된 프론트엔드(예: Netlify) 주소를 모두 허용합니다.
# 'https://musimco.netlify.app' 부분은 실제 배포된 프론트엔드 주소로 변경 필요
CORS(app, origins=["http://localhost:5173", "https://musimco.netlify.app"])

# --- S3 설정 ---
AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
BUCKET_NAME = os.getenv("BUCKET_NAME")
REGION_NAME = os.getenv("REGION_NAME")

s3 = boto3.client("s3",
                  aws_access_key_id=AWS_ACCESS_KEY,
                  aws_secret_access_key=AWS_SECRET_KEY,
                  region_name=REGION_NAME)

def upload_fileobj_to_s3(file_obj, s3_path):
    try:
        s3.upload_fileobj(file_obj, BUCKET_NAME, s3_path)
        return f"https://{BUCKET_NAME}.s3.{REGION_NAME}.amazonaws.com/{s3_path}"
    except Exception as e:
        print(f"[ERROR] S3 파일 객체 업로드 실패: {e}")
        return None

@app.route('/myPage', methods=['POST'])
def get_my_page():
    data = request.get_json()
    
    if not data or 'user_id' not in data:
        return jsonify({'error': '사용자 데이터가 없습니다.'}), 400
    
    user_id = data.get('user_id')
    user_info = user.get_user_my_page(user_id)
    
    if not user_info:
        return jsonify({'error': '존재하지 않는 사용자 입니다.'}), 404
    
    user_data = {
        'id': user_info['id'],
        'username': user_info['username'],
        'addr': user_info['addr'],
        'addr_detail': user_info['addr_detail'],
        'zipcode': user_info['zipcode'],
        'tel': user_info['tel'],
        'phone': user_info['phone'],
        'email': user_info['email'],
        'usertype': user_info['usertype'],
        'point': user_info['point']
    }
    
    return jsonify(user_data), 200
    
user_states = {}

# frame 분석
@app.route('/api/analyze_frame', methods=['POST'])
def analyze_frame():
    data = request.json
    if not data or 'image' not in data or 'user_id' not in data:
        return jsonify({'error': '이미지 또는 사용자 데이터가 없습니다.'}), 400
    
    user_id = data['user_id']
    
    # 이미지 디코딩
    image_b64 = data['image']
    if ',' in image_b64:
        image_b64 = image_b64.split(',')[1]
    
    try:
        image_bytes = base64.b64decode(image_b64)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception as e:
        return jsonify({"error": f"이미지 디코딩 실패: {str(e)}"}), 400

    if frame is None:
        return jsonify({"error": "이미지 디코딩 실패"}), 400

    # 각도 측정
    angle = daily.get_crunch_angle_from_frame(frame)
    
    if angle is None:
        return jsonify({"error": "포즈 인식 실패"}), 200
    
    # 사용자 상태 초기화
    if user_id not in user_states:
        user_states[user_id] = {
            'prev_status': 0,
            'ready_to_count': True,
            'count': 0
        }
        
    state = user_states[user_id]
    
    if angle <= 120:
        status = 1  # 몸 굽힌 상태
    elif angle >= 150:
        status = 0  # 몸 편 상태
    else:
        status = state['prev_status']  # 중간 상태에서는 이전 상태 유지
        
    if state['ready_to_count'] and state['prev_status'] == 0 and status == 1:
        state['count'] += 1
        state['ready_to_count'] = False
    
    if not state['ready_to_count'] and status == 0:
        state['ready_to_count'] = True
        
    state['prev_status'] = status
    
    return jsonify({'angle': angle, 'status': status, 'count': state['count']}), 200

# 데일리미션 보상
@app.route('/daily_mission/reward', methods=['POST'])
def daily_mission_reward():
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'user_id가 없습니다.'}), 400
    
    if user_id not in user_states:
        return jsonify({'error': '미션 기록이 없습니다.'}), 400

    today = date.today().isoformat()

    if user.daily_mission_exists(user_id, today, type="crunch"):
        return jsonify({'error': '오늘은 이미 보상을 받았습니다.'}), 400
    
    count = user_states[user_id]['count']
    success = count >= 5
    
    if success:    
        user.save_daily_mission(user_id, today, type="crunch")
        user.add_point(user_id)
        del user_states[user_id]
        return jsonify({'success': True}), 200
    else:
        return jsonify({'error': '미션 목표를 달성하지 못했습니다.'}), 400

### 레그레이즈 추가 ###

user_states_leg = {}

# frame 분석
@app.route('/api/analyze_frame/leg_raise', methods=['POST'])
def analyze_leg_raise():
    data = request.json
    if not data or 'image' not in data or 'user_id' not in data:
        return jsonify({'error': '이미지 또는 사용자 데이터가 없습니다.'}), 400
    
    user_id = data['user_id']
    
    # 이미지 디코딩
    image_b64 = data['image']
    if ',' in image_b64:
        image_b64 = image_b64.split(',')[1]
    
    try:
        image_bytes = base64.b64decode(image_b64)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception as e:
        return jsonify({"error": f"이미지 디코딩 실패: {str(e)}"}), 400

    if frame is None:
        return jsonify({"error": "이미지 디코딩 실패"}), 400

    # 각도 측정
    angle = daily.get_crunch_angle_from_frame(frame)
    
    if angle is None:
        return jsonify({"error": "포즈 인식 실패"}), 200
    
    # 사용자 상태 초기화
    if user_id not in user_states_leg:
        user_states_leg[user_id] = {
            'prev_status': 0,
            'ready_to_count': True,
            'count': 0
        }
        
    state = user_states_leg[user_id]
    
    if angle <= 120:
        status = 1  # 몸 굽힌 상태
    elif angle >= 150:
        status = 0  # 몸 편 상태
    else:
        status = state['prev_status']  # 중간 상태에서는 이전 상태 유지
        
    if state['ready_to_count'] and state['prev_status'] == 0 and status == 1:
        state['count'] += 1
        state['ready_to_count'] = False
    
    if not state['ready_to_count'] and status == 0:
        state['ready_to_count'] = True
        
    state['prev_status'] = status
    
    return jsonify({'angle': angle, 'status': status, 'count': state['count']}), 200

# 데일리미션 보상
@app.route('/daily_mission/reward/leg_raise', methods=['POST'])
def daily_mission_leg_reward():
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'error': 'user_id가 없습니다.'}), 400
    
    if user_id not in user_states_leg:
        return jsonify({'error': '미션 기록이 없습니다.'}), 400

    today = date.today().isoformat()

    if user.daily_mission_exists(user_id, today, type="leg_raise"):
        return jsonify({'error': '오늘은 이미 보상을 받았습니다.'}), 400
    
    count = user_states_leg[user_id]['count']
    success = count >= 8
    
    if success:    
        user.save_daily_mission(user_id, today, type="leg_raise")
        user.add_point(user_id)
        del user_states_leg[user_id]
        return jsonify({'success': True}), 200
    else:
        return jsonify({'error': '미션 목표를 달성하지 못했습니다.'}), 400
    
### 레그레이즈 추가 ###
    
@app.route('/attendance/month', methods=['POST'])
def attendance_month():
    data = request.get_json()
    user_id = data.get('id')
    
    if not user_id:
        return jsonify({'error': 'user_id가 누락되었습니다.'}), 400
    
    today = date.today()
    year = today.year
    month = today.month

    records = user.get_attendance_month(user_id, year, month)
    if not records:
        return jsonify({'message': '이번달의 출석 기록이 없습니다.'}), 200
    
    formatted_records = [str(d) for d in records]
    return jsonify({'user_id': user_id, 'records': formatted_records}), 200

# 댓글 추천
@app.route('/comment/<int:comment_id>/recommend', methods=['POST'])
def recommend_comment(comment_id):
    data = request.get_json()
    user_id = data.get('id')
    
    is_recommended = comment.toggle_recommend_comment(user_id, comment_id)
    recommend_count = comment.get_comment_recommend_count(comment_id)
    return jsonify({'message': 'Recommend toggled', 'is_recommended': is_recommended, 'comment_id': comment_id, 'recommend_count': recommend_count}), 200

# 영상 추천
@app.route('/video/<int:video_id>/recommend', methods=['POST'])
def recommend_video(video_id):
    data = request.get_json()
    user_id = data.get('id')
    
    is_recommended = video.toggle_recommend_video(user_id, video_id)
    recommend_count = video.get_video_recommend_count(video_id)
    return jsonify({'message': 'Recommend toggled', 'is_recommended': is_recommended, 'video_id': video_id, 'recommend_count': recommend_count}), 200
@app.route('/video/<int:video_id>/recommend/status', methods=['GET'])
def get_recommend_status(video_id):
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id 누락'}), 400

    with get_connection().cursor() as cursor:
        cursor.execute(
            "SELECT 1 FROM Recommendation WHERE user_id = %s AND video_id = %s",
            (user_id, video_id)
        )
        is_recommended = bool(cursor.fetchone())
        return jsonify({'is_recommended': is_recommended}), 200

# 댓글 추천수 조회 (사용 안함)
@app.route('/comment/<int:comment_id>/recommend/count', methods=['GET'])
def comment_recommend_count(comment_id):
    count = comment.get_comment_recommend_count(comment_id)
    return jsonify({'comment_id': comment_id, 'recommend_count': count}), 200

@app.route('/attendance', methods=['POST'])
def attendance():
    data = request.get_json()
    user_id = data.get("id")
    today = date.today().isoformat()
    
    today_attendance = user.check_attendance(user_id, today)
    
    if today_attendance:
        return jsonify({'message': '이미 출석 했습니다.'}), 400
    else:
        user.add_attendance(user_id, today)
        user.add_point(user_id)
        return jsonify({'message': '출석 완료. 포인트 50점이 지급되었습니다.'}), 200

@app.route('/rank/my', methods=['POST'])
def rank_my():
    data = request.get_json()
    user_id = data.get("id")
    
    rank_data = rank.get_rank_my(user_id)
    if not rank_data:
        return jsonify({'error': '순위 정보를 불러올 수 없습니다.'}), 404
    return jsonify(rank_data), 200

@app.route('/rank/top5', methods=['GET'])
def rank_top5():
    rank_data = rank.get_rank_top5()
    if not rank_data:
        return jsonify({'error': '순위 정보를 불러올 수 없습니다.'}), 404
    return jsonify(rank_data), 200

@app.route('/rank/all', methods=['GET'])
def rank_all():
    rank_data = rank.get_rank_all()
    if not rank_data:
        return jsonify({'error': '순위 정보를 불러올 수 없습니다.'}), 404
    return jsonify(rank_data), 200

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
@app.route('/video/<int:video_id>/favorite/status', methods=['GET'])
def get_favorite_status(video_id):
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id 누락'}), 400

    with get_connection().cursor() as cursor:
        cursor.execute(
            "SELECT 1 FROM Favorite WHERE user_id = %s AND video_id = %s",
            (user_id, video_id)
        )
        is_favorited = bool(cursor.fetchone())
        return jsonify({'is_favorited': is_favorited}), 200

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

@app.route('/video/<int:video_id>/view', methods=['POST'])
def increase_view(video_id):
    video_data = get_video_by_id(video_id)
    if not video_data:
        return jsonify({'error': 'Video not found'}), 404
    
    video.increase_view_count(video_id)
    return jsonify({'message': 'View count increased'}), 200

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
    is_favorited = toggle_favorite(user_id, video_id)
    return jsonify({'message': 'Favorite toggled', 'is_favorited': is_favorited}), 200

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
    user_id = request.args.get("user_id")  # 프론트에서 ?user_id=xxx 으로 보내야 함
    comments = get_comments_by_video(video_id, sort)

    # 댓글마다 is_recommended 여부 추가
    for c in comments:
        if user_id:
            with get_connection().cursor() as cursor:
                cursor.execute(
                    "SELECT 1 FROM CommentRecommendation WHERE user_id = %s AND comment_id = %s",
                    (user_id, c['id'])
                )
                c['is_recommended'] = bool(cursor.fetchone())
        else:
            c['is_recommended'] = False

    return jsonify(comments), 200


@app.route('/video/<int:video_id>/posture/upload', methods=['POST'])
def upload_posture_video(video_id):
    if 'video_file' not in request.files:
        return jsonify({"error": "영상 파일이 없습니다."}), 400

    user_id = request.form.get("user_id")
    file = request.files["video_file"]

    if not user_id:
        return jsonify({"error": "사용자 ID가 없습니다."}), 400
    if file.filename == '':
        return jsonify({"error": "선택된 파일이 없습니다."}), 400

    # --- S3 업로드 로직 (최종 완성본과 동일) ---
    original_filename = secure_filename(file.filename)
    original_s3_key = f"posture_originals/{user_id}_{video_id}_{uuid.uuid4().hex}_{original_filename}"
    
    original_s3_url = upload_fileobj_to_s3(file.stream, original_s3_key)
    if not original_s3_url:
        return jsonify({"error": "원본 영상을 S3에 업로드하지 못했습니다."}), 500

    # --- AI 분석 로직 (최종 완성본과 동일) ---
    try:
        frames = read_video_to_frames(original_s3_url)
        if not frames:
            return jsonify({"error": "영상에서 프레임을 읽을 수 없습니다."}), 400
    except Exception as e:
        return jsonify({"error": f"영상 처리 중 오류 발생: {str(e)}"}), 500
        
    with get_connection().cursor() as cursor:
        cursor.execute("SELECT model_path, num_conditions FROM PostureModel WHERE video_id = %s", (video_id,))
        model_row = cursor.fetchone()
        if not model_row:
            return jsonify({"error": "해당 영상에 대한 분석 모델이 없습니다."}), 404
    model_path = abs_model_path(model_row["model_path"])  # 상대→절대
    num_conditions = model_row["num_conditions"]

    if not os.path.exists(model_path):
        return jsonify({"error": f"모델 파일이 없습니다: {model_path}"}), 500

    eval_output = evaluate(frames, model_path=model_path, num_conditions=num_conditions)
    eval_result = eval_output["results"]
    annotated_frames = eval_output.get("annotated_frames", frames)

    # --- 결과 영상 S3 업로드 (최종 완성본과 동일) ---
    output_filename = f"{user_id}_{video_id}_{uuid.uuid4().hex}_result.mp4"
    
    result_video_bytes = save_result_video(annotated_frames)
    if not result_video_bytes:
        return jsonify({"error": "결과 영상 생성에 실패했습니다."}), 500

    result_s3_key = f"posture_results/{output_filename}"
    result_s3_url = upload_fileobj_to_s3(io.BytesIO(result_video_bytes), result_s3_key)
    if not result_s3_url:
        return jsonify({"error": "결과 영상을 S3에 업로드하지 못했습니다."}), 500

    # --- 결과 텍스트 생성 및 DB 저장 (최종 완성본과 동일) ---
    with get_connection().cursor() as cursor:
        cursor.execute("SELECT condition_index, description FROM PostureCondition WHERE video_id = %s", (video_id,))
        condition_map = {row['condition_index']: row['description'] for row in cursor.fetchall()}
    result_lines = []
    for r in eval_result:
        cond, score, passed = r['condition'], r['score'], r['value']
        desc = condition_map.get(cond, f"조건 {cond}")
        emoji = "✅" if passed else "❌"
        result_lines.append(f"{emoji} {desc} (score: {score:.4f})")
    result_text = "\n".join(result_lines)
    
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO PostureResult (user_id, video_id, result_text, image_url, result_video_url, saved_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
            """, (user_id, video_id, result_text, original_s3_url, result_s3_url))
            conn.commit()

    # --- 미리보기 프레임 생성 및 최종 응답 (최종 완성본과 동일) ---
    sampled_frames = [annotated_frames[i] for i in range(0, len(annotated_frames), 30)][:10]
    preview_frames = [
        base64.b64encode(cv2.imencode(".jpg", f)[1]).decode() for f in sampled_frames
    ]

    return jsonify({
        "message": "분석 완료",
        "result_text": result_text,
        "original_video_url": original_s3_url,
        "result_video_url": result_s3_url,
        "preview_frames": preview_frames
    }), 200

@app.route('/video/<int:video_id>/posture/analyze', methods=['POST'])
def analyze_posture(video_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "JSON 데이터가 필요합니다."}), 400

        video_path = data.get("video_path")
        user_id = data.get("user_id")
        if not video_path or not user_id:
            return jsonify({"error": "video_path와 user_id가 필요합니다."}), 400

        # 영상에서 프레임 추출
        cap = cv2.VideoCapture(video_path)
        frames = []
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frames.append(frame)
        cap.release()

        # 모델 정보 불러오기
        with get_connection().cursor() as cursor:
            cursor.execute("SELECT model_path, num_conditions FROM PostureModel WHERE video_id = %s", (video_id,))
            result = cursor.fetchone()
            if not result:
                return jsonify({"error": "모델 설정이 없습니다."}), 400
            model_path = abs_model_path(result["model_path"])
            num_conditions = result["num_conditions"]

        # AI 평가
        eval_output = evaluate(frames, model_path=model_path, num_conditions=num_conditions)

        if not isinstance(eval_output, dict) or 'results' not in eval_output:
            raise ValueError("evaluate() 결과가 올바른 딕셔너리 형태가 아닙니다.")

        eval_result = eval_output['results']

        # 조건 인덱스를 설명으로 변환
        with get_connection().cursor() as cursor:
            cursor.execute("""
                SELECT condition_index, description 
                FROM PostureCondition 
                WHERE video_id = %s
            """, (video_id,))
            condition_map = {row['condition_index']: row['description'] for row in cursor.fetchall()}

        # 사용자에게 보여줄 결과 포맷팅
        result_lines = []
        for r in eval_result:
            idx = r.get('condition', 'Unknown')
            description = condition_map.get(idx, f"Condition {idx}")
            score = r.get('score', 0)
            if r.get('value', True):
                result_lines.append(f"✅ {description} (score: {score:.4f})")
            else:
                result_lines.append(f"❌ {description} 이상 감지 (score: {score:.4f})")

        result_text = "\n".join(result_lines)

        # 결과 저장
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO PostureResult (user_id, video_id, result_text, image_url)
                    VALUES (%s, %s, %s, %s)
                """, (user_id, video_id, result_text, video_path))
                conn.commit()

        return jsonify({
            "result_text": result_text,
            "results": eval_result
        }), 200

    except Exception as e:
        print(f"[ERROR] analyze_posture 실패: {str(e)}")
        return jsonify({
            "valid": False,
            "message": f"분석 실패: {str(e)}"
        }), 500

    
# 분석 결과 조회
@app.route('/video/<int:video_id>/posture/result', methods=['GET'])
def get_posture_result(video_id):
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id가 필요합니다."}), 400

    with get_connection().cursor() as cursor:
        cursor.execute("""
            SELECT result_text, image_url, result_video_url, saved_at 
            FROM PostureResult 
            WHERE user_id = %s AND video_id = %s
            ORDER BY saved_at DESC
            LIMIT 1
        """, (user_id, video_id))
        result = cursor.fetchone()

        if not result:
            return jsonify({"message": "분석 결과가 없습니다."}), 404

    #분석된 프레임 재생성 (결과 영상으로부터)
    try:
        frames = read_video_to_frames(result["result_video_url"])
        sampled_frames = [frames[i] for i in range(0, len(frames), 30)][:10]
        preview_frames = [
            base64.b64encode(cv2.imencode(".jpg", f)[1]).decode() for f in sampled_frames
        ]
    except Exception as e:
        print(f"preview_frames 생성 실패: {str(e)}")
        preview_frames = []

    return jsonify({
        "result_text": result["result_text"],
        "image_url": result["image_url"],
        "result_video_url": result["result_video_url"],
        "saved_at": result["saved_at"],
        "preview_frames": preview_frames  # 프론트에서 결과 밑에 표시
    }), 200


@app.route('/video/<int:video_id>/posture/save', methods=['POST'])
def save_posture(video_id):
    data = request.get_json()
    user_id = data.get("user_id")
    result_text = data.get("result_text")
    image_url = data.get("image_url")

    with get_connection().cursor() as cursor:
        cursor.execute("""
            INSERT INTO PostureResult (user_id, video_id, result_text, image_url)
            VALUES (%s, %s, %s, %s)
        """, (user_id, video_id, result_text, image_url))

    return jsonify({"message": "분석 결과 저장 완료"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    id = data.get("id")  # 로그인용 아이디 (문자열)
    password = data.get("password")
    
    db_user = user.get_user(id)
    if not db_user:
        return jsonify({'error': '존재하지 않는 아이디 입니다.'}), 401

    db_password = db_user[0]['password']     # 비밀번호 체크용
    db_user_pk = db_user[0]['id']            # 이게 진짜 user_id (int) → 프론트에 넘길 것
    db_username = db_user[0].get('username', '') # 사용자 이름 추가
    
    if not check_password_hash(db_password, password):
        return jsonify({'error': '잘못된 비밀번호 입니다.'}), 401

    return jsonify({
        'message': '로그인 되었습니다.',
        'user_id': db_user_pk,  # 반드시 정수형 id로
        'username': db_username  # 사용자 이름도 반환!!
    }), 200



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

    required_fields = {
        "usertype": usertype, "id": userid, "password": password, "password_confirm": password_confirm,
        "username": username, "addr": addr, "zipcode": zipcode, "phone": phone, "email": email
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
        return jsonify({'error': '비밀번호는 영문 대소문자/숫자/특수문자 중 2가지 이상 포함, 10~16자입니다.'}), 400
    if not is_valid_email(email):
        return jsonify({'error': '이메일 형식이 올바르지 않습니다.'}), 400

    hashed_pw = generate_password_hash(password)
    try:
        user.add_user(usertype, userid, hashed_pw, username, zipcode, addr, addr_detail, tel, phone, email)
    except Exception as e:
        return jsonify({'error': f'DB 오류: {str(e)}'}), 500

    return jsonify({'message': '회원가입 성공!'}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # PORT 환경변수 없으면 5000 사용
    app.run(debug=True, host='0.0.0.0', port=port)
