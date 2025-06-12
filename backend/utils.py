import re
import cv2
import imageio
import numpy as np
import io

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

def read_video_to_frames(video_path):
    # video_path는 이제 로컬 경로 또는 S3 URL이 될 수 있습니다.
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        print(f"[ERROR] 영상을 열 수 없습니다. 경로 또는 URL을 확인하세요: {video_path}")
        return []

    frames = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)

    cap.release()
    return frames

def save_result_video(frames, fps=30):
    """
    imageio와 io.BytesIO를 사용하여 메모리에서 직접 mp4 영상 데이터를 생성하고
    그 결과를 바이트(bytes)로 반환합니다. 이 방식이 가장 안정적입니다.
    """
    if not frames:
        print("[ERROR] 영상으로 만들 프레임이 없습니다.")
        return None
    
    try:
        # 1. 최종 영상 데이터가 담길 메모리 버퍼를 생성합니다.
        buffer = io.BytesIO()

        # 2. imageio.get_writer에 파일 경로 대신 이 버퍼 객체를 전달합니다.
        with imageio.get_writer(buffer, format='mp4', mode='I', fps=fps, codec='libx264') as writer:
            for frame in frames:
                # 3. 색상 보정(BGR -> RGB) 후 프레임을 버퍼에 씁니다.
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                writer.append_data(frame_rgb)
        
        # 4. 'with' 구문이 끝나면 버퍼에 모든 영상 데이터가 기록됩니다.
        # 버퍼의 .getvalue() 메소드로 전체 바이트 데이터를 가져옵니다.
        video_bytes = buffer.getvalue()
        
        if not video_bytes:
            print("[ERROR] imageio로 영상을 생성했지만 데이터가 비어있습니다.")
            return None

        return video_bytes

    except Exception as e:
        print(f"[ERROR] imageio로 영상 생성 중 최종 오류 발생: {e}")
        return None