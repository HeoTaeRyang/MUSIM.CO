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

def save_frames_to_video(frames, output_path, fps=15):
    if not frames:
        print("저장할 프레임이 없습니다.")
        return

    height, width = frames[0].shape[:2]
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # MP4 코덱
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    for frame in frames:
        out.write(frame)

    out.release()
    print(f"비디오가 저장되었습니다: {output_path}")

# 프레임 추출
video_frames = read_video_to_frames("test.mp4")

# 자세 평가 운동마다 num_conditions 수정 필요
result = evaluate(
    frames=video_frames,
    num_conditions=5,
    model_path="backend/ai/1/1.pth"
)

save_frames_to_video(result["annotated_frames"], "test_output.mp4", fps=15)


# #데일리 미션 크런치
# frame = cv2.imread("test.jpg")
# angle = get_crunch_angle_from_frame(frame)

# if angle is not None:
#     print(f"각도: {angle:.2f}°")
# else:
#     print("관절을 찾을 수 없습니다.")