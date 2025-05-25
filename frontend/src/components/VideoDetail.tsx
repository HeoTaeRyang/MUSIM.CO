import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import "../styles/VideoDetail.css";

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

const VideoDetail: React.FC<Props> = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { videoId } = useParams();

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showVolume, setShowVolume] = useState(false);
  const [volume, setVolume] = useState(1);

  const video: Video = location.state?.video || {
    id: props.videoId ?? "sample",
    title: "샘플 영상",
    video: "/assets/sample_video.mp4",
  };

  const srcToUse = props.videoSrc || video.video;

  useEffect(() => {
    if (!video.id) return;
    fetch(`/video/${video.id}/comments?sort=latest`)
      .then((res) => res.json())
      .then((data) => setComments(data))
      .catch((err) => console.error("댓글 불러오기 실패:", err));
  }, [video.id]);

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return;
    fetch(`/video/${video.id}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: 1, content: commentText }),
    })
      .then((res) => res.json())
      .then((createdComment) => {
        setComments((prev) => [createdComment, ...prev]);
        setCommentText("");
      })
      .catch((err) => console.error("댓글 작성 실패:", err));
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };
  const handleTimeUpdate = () => {
    if (videoRef.current) setProgress(videoRef.current.currentTime);
  };
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = Number(e.target.value);
    if (videoRef.current) videoRef.current.currentTime = seekTime;
    setProgress(seekTime);
  };
  const handlePlay = () => videoRef.current?.play();
  const handlePause = () => videoRef.current?.pause();

  const handleVolumeBtnClick = () => setShowVolume((v) => !v);
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen)
        videoRef.current.requestFullscreen();
      else if ((videoRef.current as any).webkitRequestFullscreen)
        (videoRef.current as any).webkitRequestFullscreen();
      else if ((videoRef.current as any).msRequestFullscreen)
        (videoRef.current as any).msRequestFullscreen();
    }
  };

  const handleCartClick = () =>
    props.onCartClick
      ? props.onCartClick()
      : navigate(`/video/${video.id}/purchase`, {
          state: { video },
        });

  const handleAnalyzeClick = () =>
    props.onAnalyzeClick
      ? props.onAnalyzeClick()
      : navigate(`/video/${video.id}/VideoAnalyze`, {
          state: { video },
        });

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="video-detail-container">
      <div className="video-player-section">
        <video
          className="video-player"
          src={srcToUse}
          ref={videoRef}
          autoPlay
          muted={false}
          loop
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
        />
        <div className="video-controls-bar flex-controls-bar">
          <button className="control-btn" onClick={handlePlay} title="재생">
            <img src="/src/assets/video/play.png" alt="재생" />
          </button>
          <button
            className="control-btn"
            onClick={handlePause}
            title="일시정지"
          >
            <img src="/src/assets/video/pause.png" alt="일시정지" />
          </button>
          <button
            className="control-btn"
            title="볼륨"
            onClick={handleVolumeBtnClick}
          >
            <img src="/src/assets/video/volume.png" alt="볼륨" />
          </button>
          {showVolume && (
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              className="volume-bar"
              onChange={handleVolumeChange}
              style={{ width: "80px", marginLeft: 4, verticalAlign: "middle" }}
            />
          )}
          <span className="seek-time">{formatTime(progress)}</span>
          <input
            className="seek-bar inline-seek"
            type="range"
            min={0}
            max={duration}
            value={progress}
            step="0.1"
            onChange={handleSeek}
          />
          <span className="seek-time">{formatTime(duration)}</span>
          <button
            className="control-btn"
            title="카메라"
            onClick={handleAnalyzeClick}
          >
            <img src="/src/assets/video/camera.png" alt="카메라" />
          </button>
          <button
            className="control-btn"
            title="장바구니"
            onClick={handleCartClick}
          >
            <img src="/src/assets/video/cart.png" alt="장바구니" />
          </button>
          <button className="control-btn" title="북마크">
            <img src="/src/assets/video/Bookmark.png" alt="북마크" />
          </button>
          <button className="control-btn" title="정보">
            <img src="/src/assets/video/Info.png" alt="정보" />
          </button>
          <button className="control-btn" title="즐겨찾기">
            <img src="/src/assets/video/Star.png" alt="즐겨찾기" />
          </button>
          <button
            className="control-btn"
            title="전체화면"
            onClick={handleFullscreen}
          >
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
