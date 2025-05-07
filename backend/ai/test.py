from active import evaluate_video
from condition import evaluate
from pytube import YouTube
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

def download_youtube_video(url, output_path="downloaded.mp4"):
    yt = YouTube(url)
    stream = yt.streams.filter(file_extension='mp4', progressive=True).order_by('resolution').desc().first()
    stream.download(filename=output_path)
    return output_path

# 유튜브 영상 URL
youtube_url = "https://www.youtube.com/watch?v=KYv_caP92Gg"

# 영상 다운로드
local_path = download_youtube_video(youtube_url)

# 이후에 프레임 추출 등으로 사용
video_frames = read_video_to_frames(local_path)

frames_active = evaluate_video(
    frames = video_frames, 
    model_path="1/active.pth"
)


# 자세 평가
result = evaluate(
    frames=frames_active,
    model_path="1/condition.pth"
)

print(result)