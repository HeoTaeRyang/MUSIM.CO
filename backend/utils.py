import re
import cv2

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
    cap = cv2.VideoCapture(video_path)
    frames = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)

    cap.release()
    return frames

def save_result_video(frames, output_path, fps=30):
    if not frames:
        return False

    height, width, _ = frames[0].shape
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    for frame in frames:
        out.write(frame)

    out.release()
    return True
