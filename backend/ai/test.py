from condition import evaluate
from daily import get_crunch_angle_from_frame
import cv2

def read_video_to_frames(path):
    cap = cv2.VideoCapture(path)
    frames = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frames.append(frame)

    cap.release()
    return frames

# 프레임 추출
video_frames = read_video_to_frames("test.mp4")

# 자세 평가 운동마다 num_conditions 수정 필요
result = evaluate(
    frames=video_frames,
    num_conditions=5,
    model_path="backend/ai/1/1.pth"
)

print(result)


#데일리 미션 크런치
frame = cv2.imread("test.jpg")
angle = get_crunch_angle_from_frame(frame)

if angle is not None:
    print(f"각도: {angle:.2f}°")
else:
    print("관절을 찾을 수 없습니다.")