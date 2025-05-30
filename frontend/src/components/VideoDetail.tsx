import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import "../styles/VideoDetail.css";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface Comment {
  id: number;
  user: string;
  avatar: string;
  date: string;
  text: string;
  rating: number;
}

interface Video {
  id: string;
  title: string;
  video: string;
}

interface Props {
  videoId?: string;
  hideComments?: boolean;
  videoSrc?: string;
  fullWidth?: boolean;
  onAnalyzeClick?: () => void;
  onCartClick?: () => void;
}

const extractYoutubeId = (url: string): string | null => {
  const match = url.match(/(?:\?v=|\/embed\/|\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

const API_BASE_URL = "http://127.0.0.1:5000";

const VideoDetail: React.FC<Props> = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { videoId } = useParams();

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");

  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(100);
  const [showVolume, setShowVolume] = useState(false);

  const playerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);

  const video: Video = location.state?.video || {
    id: props.videoId ?? "sample",
    title: "샘플 영상",
    video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  };

  const youtubeId = extractYoutubeId(props.videoSrc || video.video);

  useEffect(() => {
    if (!youtubeId) return;

    const loadPlayer = () => {
      const player = new window.YT.Player("youtube-player", {
        videoId: youtubeId,
        playerVars: {
          controls: 0,
          modestbranding: 1,
          rel: 0,
          fs: 0,
          disablekb: 1,
          iv_load_policy: 3,
          showinfo: 0,
          autoplay: 0,
        },
        events: {
          onReady: (event: any) => {
            playerRef.current = event.target;
            const checkDuration = setInterval(() => {
              const dur = event.target.getDuration();
              if (dur && dur > 0) {
                setDuration(dur);
                clearInterval(checkDuration);
              }
            }, 300);

            intervalRef.current = setInterval(() => {
              setProgress(event.target.getCurrentTime());
            }, 500);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      loadPlayer();
    } else {
      window.onYouTubeIframeAPIReady = loadPlayer;
      const existingScript = document.querySelector(
        "script[src='https://www.youtube.com/iframe_api']"
      );
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
    }

    return () => clearInterval(intervalRef.current);
  }, [youtubeId]);

  useEffect(() => {
    if (!video.id) return;
    fetch(`${API_BASE_URL}/video/${video.id}/comments?sort=latest`)
      .then((res) => res.json())
      .then(setComments)
      .catch((err) => console.error("댓글 불러오기 실패:", err));
  }, [video.id]);

  const handlePlay = () => playerRef.current?.playVideo();
  const handlePause = () => playerRef.current?.pauseVideo();
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    playerRef.current?.seekTo(time, true);
    setProgress(time);
  };

  const handleVolumeBtnClick = () => setShowVolume((v) => !v);
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    playerRef.current?.setVolume(v);
  };
  const handleFullscreen = () => {
    const iframe = document.getElementById(
      "youtube-player"
    ) as HTMLIFrameElement;
    iframe?.requestFullscreen();
  };

  const handleCartClick = () =>
    props.onCartClick
      ? props.onCartClick()
      : navigate(`/video/${video.id}/purchase`, { state: { video } });

  const handleAnalyzeClick = () =>
    props.onAnalyzeClick
      ? props.onAnalyzeClick()
      : navigate(`/video/${video.id}/VideoAnalyze`, { state: { video } });

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return;

    const rawId = localStorage.getItem("user_id");
    const user_id = localStorage.getItem("user_id");
    if (!user_id) {
      alert("로그인이 필요합니다.");
      return;
    }

    fetch(`${API_BASE_URL}/video/${video.id}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, content: commentText }), // user_id는 string
    })
      .then((res) => {
        if (!res.ok) throw new Error("댓글 등록 실패");
        return res.json();
      })
      .then((createdComment) => {
        setComments((prev) => [
          {
            ...createdComment,
            user: localStorage.getItem("user_id"), // 작성자 이름 직접 지정
            avatar: "/assets/sample_profile.png", // 기본 이미지 지정
            text: commentText, // 작성한 내용 직접 지정
            rating: 5, // 예시로 넣음 (필요 시 수정)
          },
          ...prev,
        ]);
        setCommentText("");
      })

      .catch((err) => {
        console.error("댓글 작성 실패:", err);
        alert("댓글 작성 중 오류가 발생했습니다.");
      });
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="video-detail-container">
      <div className="video-player-section">
        <div id="youtube-player" className="video-player" />
        <div className="video-controls-bar flex-controls-bar">
          <button className="control-btn" onClick={handlePlay}>
            <img src="/src/assets/video/play.png" alt="재생" />
          </button>
          <button className="control-btn" onClick={handlePause}>
            <img src="/src/assets/video/pause.png" alt="일시정지" />
          </button>
          <button className="control-btn" onClick={handleVolumeBtnClick}>
            <img src="/src/assets/video/volume.png" alt="볼륨" />
          </button>
          {showVolume && (
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={handleVolumeChange}
              className="volume-bar"
            />
          )}
          <span className="seek-time">{formatTime(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration}
            value={progress}
            step="0.1"
            onChange={handleSeek}
            className="seek-bar inline-seek"
          />
          <span className="seek-time">{formatTime(duration)}</span>
          <button className="control-btn" onClick={handleAnalyzeClick}>
            <img src="/src/assets/video/camera.png" alt="카메라" />
          </button>
          <button className="control-btn" onClick={handleCartClick}>
            <img src="/src/assets/video/cart.png" alt="장바구니" />
          </button>
          <button className="control-btn" onClick={handleFullscreen}>
            <img src="/src/assets/video/fullscreen.png" alt="전체화면" />
          </button>
        </div>
      </div>

      {!props.hideComments && (
        <>
          <div className="comment-input-section">
            <input
              type="text"
              placeholder="으쌰으쌰! 운동을 하면서 어떤 기분이었나요?"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button className="submit-btn" onClick={handleCommentSubmit}>
              댓글달기
            </button>
          </div>
          <div className="comments-list">
            {comments.map((comment) => (
              <div key={comment.id} className="comment-card">
                <img
                  className="avatar"
                  src={comment.avatar || "/assets/sample_profile.png"}
                  alt="프로필"
                />
                <div className="comment-body">
                  <div className="comment-header">
                    <span className="user">{comment.user || "익명"}</span>
                    <span className="date">{comment.date}</span>
                    <span className="rating">{"★".repeat(comment.rating)}</span>
                  </div>
                  <div className="comment-text">{comment.text}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default VideoDetail;
