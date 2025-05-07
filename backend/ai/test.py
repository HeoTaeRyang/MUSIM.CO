from condition import evaluate
import cv2

def read_video_to_frames(path, target_fps=30):
    cap = cv2.VideoCapture(path)
    original_fps = cap.get(cv2.CAP_PROP_FPS)
    if original_fps == 0:
        print("⚠️ 원본 영상 FPS를 가져올 수 없습니다. 기본 30fps로 처리합니다.")
        original_fps = 30

    frame_interval = int(round(original_fps / target_fps))
    frames = []
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % frame_interval == 0:
            frames.append(frame)
        frame_idx += 1

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