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
video_frames = read_video_to_frames("/home/elicer/exer/test/output_clip1.mp4")

# 자세 평가
result = evaluate(
    frames=video_frames,
    model_path="1/condition.pth"
)

print(result)