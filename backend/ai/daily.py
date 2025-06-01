import mediapipe as mp
import cv2
import numpy as np

# Mediapipe 초기화
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(static_image_mode=True)

def get_angle(a, b, c):
    """3점 사이의 각도 계산 (중심점: b)"""
    a, b, c = np.array(a), np.array(b), np.array(c)
    ba = a - b
    bc = c - b
    cosine = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    angle = np.arccos(np.clip(cosine, -1.0, 1.0))
    return np.degrees(angle)

def get_landmark_coords(landmarks, idx, threshold=0.5):
    lm = landmarks[idx]
    if lm.visibility > threshold:
        return [lm.x, lm.y]
    else:
        return None

def get_crunch_angle_from_frame(frame):
    """프레임에서 발-엉덩이-어깨 각도 반환 (우선 오른쪽, 없으면 왼쪽 사용)"""
    image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(image_rgb)

    if not results.pose_landmarks:
        return None  # 전체 포즈 인식 실패

    lm = results.pose_landmarks.landmark
    
    for side in ["RIGHT", "LEFT"]:
        ankle = get_landmark_coords(lm, getattr(mp_pose.PoseLandmark, f"{side}_ANKLE").value)
        hip = get_landmark_coords(lm, getattr(mp_pose.PoseLandmark, f"{side}_HIP").value)
        shoulder = get_landmark_coords(lm, getattr(mp_pose.PoseLandmark, f"{side}_SHOULDER").value)

        if ankle and hip and shoulder:
            return get_angle(ankle, hip, shoulder)

    return None  # 양쪽 다 실패한 경우