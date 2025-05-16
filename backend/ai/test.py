from condition import evaluate
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