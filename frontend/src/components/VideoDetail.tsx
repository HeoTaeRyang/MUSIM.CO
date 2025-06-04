import React, { useEffect, useState } from "react";
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
  videoSrc?: string;
  hideComments?: boolean;
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

  const video: Video = location.state?.video || {
    id: props.videoId ?? "sample",
    title: "샘플 영상",
    video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  };

  const youtubeId = extractYoutubeId(props.videoSrc || video.video);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isFavorite, setIsFavorite] = useState(false); // ★ 즐겨찾기 상태

  useEffect(() => {
    if (!video.id) return;

    fetch(`${API_BASE_URL}/video/${video.id}/comments?sort=latest`)
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((c: any) => ({
          id: c.id,
          user: c.user_id || "익명",
          avatar: "/assets/sample_profile.png",
          date: c.created_at || "",
          text: c.content || "",
          rating: 5,
        }));
        setComments(mapped);
      })
      .catch((err) => console.error("댓글 불러오기 실패:", err));
  }, [video.id]);

  const handleCartClick = () => {
    props.onCartClick?.();
    navigate(`/video/${video.id}/purchase`, { state: { video } });
  };

  const handleAnalyzeClick = () => {
    props.onAnalyzeClick?.();
    navigate(`/video/${video.id}/VideoAnalyze`, { state: { video } });
  };

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return;
    const user_id = localStorage.getItem("user_id");
    if (!user_id) {
      alert("로그인이 필요합니다.");
      return;
    }

    fetch(`${API_BASE_URL}/video/${video.id}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, content: commentText }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("댓글 등록 실패");
        return res.json();
      })
      .then((createdComment) => {
        setComments((prev) => [
          {
            ...createdComment,
            user: user_id,
            avatar: "/assets/sample_profile.png",
            text: commentText,
            rating: 5,
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

  const toggleFavorite = () => {
    const user_id = localStorage.getItem("user_id");
    if (!user_id) {
      alert("로그인이 필요합니다.");
      return;
    }

    fetch(`${API_BASE_URL}/video/${video.id}/favorite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("즐겨찾기 실패");
        return res.json();
      })
      .then((data) => {
        const isFavorited = data.is_favorited;
        setIsFavorite(isFavorited); // 상태 갱신
        alert(
          isFavorited ? "즐겨찾기 등록했습니다!" : "즐겨찾기를 해제했습니다!"
        );
      })
      .catch((err) => {
        console.error("즐겨찾기 실패:", err);
        alert("즐겨찾기 중 오류가 발생했습니다.");
      });
  };

  return (
    <div className="video-detail-container">
      <div className="horizontal-layout">
        <div className="video-player-section">
          <iframe
            id="youtube-player"
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${youtubeId}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>

        <div className="video-side-buttons">
          <button className="side-btn" onClick={handleAnalyzeClick}>
            <img src="/src/assets/video/camera.png" alt="분석" />
          </button>
          <button className="side-btn" onClick={handleCartClick}>
            <img src="/src/assets/video/cart.png" alt="장바구니" />
          </button>
          <button className="side-btn" onClick={toggleFavorite}>
            <img src="/src/assets/video/star.png" alt="즐겨찾기" />
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
