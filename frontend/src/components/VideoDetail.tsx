import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/VideoDetail.css";
interface Comment {
  id: number;
  user: string;
  avatar: string;
  date: string;
  text: string;
  rating: number;
  recommendCount: number;
  isRecommended?: boolean;
}

interface Video {
  id: string;
  title: string;
  video: string;
}

interface VideoInfo {
  id: number;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  upload_date: string;
  views: number;
  recommendations: number;
  product_link: string | null;
  correctable: number;
}

interface RawComment {
  id: number;
  user_id: string;
  created_at: string;
  content: string;
  is_recommended: boolean;
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

const API_BASE_URL = "https://web-production-6e732.up.railway.app";

const VideoDetail: React.FC<Props> = (props) => {
  const navigate = useNavigate();
  const location = useLocation();

  const video: Video = location.state?.video || {
    id: props.videoId ?? "sample",
    title: "샘플 영상",
    video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  };

  const youtubeId = extractYoutubeId(props.videoSrc || video.video);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isRecommended, setIsRecommended] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (userId) {
      fetch(
        `${API_BASE_URL}/video/${video.id}/recommend/status?user_id=${userId}`
      )
        .then((res) => res.json())
        .then((data) => setIsRecommended(data.is_recommended))
        .catch((err) => console.error("추천 상태 확인 실패:", err));
    }
  }, [video.id]);

  useEffect(() => {
    if (!video.id) return;

    fetch(
      `${API_BASE_URL}/video/${
        video.id
      }/comments?sort=latest&user_id=${localStorage.getItem("user_id")}`
    )
      .then((res) => res.json())
      .then(async (data: RawComment[]) => {
        const mapped = await Promise.all(
          data.map(async (c: RawComment) => {
            const res = await fetch(
              `${API_BASE_URL}/comment/${c.id}/recommend/count`
            );
            const countData = await res.json();

            return {
              id: c.id,
              user: c.user_id || "익명",
              avatar: "/sample_profile.png",
              date: c.created_at || "",
              text: c.content || "",
              rating: 5,
              recommendCount: countData.recommend_count || 0,
              isRecommended: c.is_recommended || false,
            };
          })
        );
        setComments(mapped);
      })
      .catch((err) => console.error("댓글 불러오기 실패:", err));
  }, [video.id]);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (userId) {
      fetch(
        `${API_BASE_URL}/video/${video.id}/favorite/status?user_id=${userId}`
      )
        .then((res) => res.json())
        .then((data) => {
          setIsFavorite(data.is_favorited);
        })
        .catch((err) => console.error("즐겨찾기 상태 확인 실패:", err));
    }
  }, [video.id]);

  const toggleRecommendation = async () => {
    const user_id = localStorage.getItem("user_id");
    if (!user_id) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/video/${video.id}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user_id }),
      });

      if (!res.ok) throw new Error("추천 처리 실패");
      const data = await res.json();

      setIsRecommended(data.is_recommended);
      alert(data.is_recommended ? "추천 완료!" : "추천을 취소했습니다.");
    } catch (err) {
      console.error("추천 실패:", err);
      alert("추천 중 오류 발생");
    }
  };

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
            avatar: "/sample_profile.png",
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
  const handleRecommend = async (commentId: number) => {
    const user_id = localStorage.getItem("user_id");
    if (!user_id) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/comment/${commentId}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user_id }),
      });

      const countRes = await fetch(
        `${API_BASE_URL}/comment/${commentId}/recommend/count`
      );
      const { recommend_count } = await countRes.json();

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                recommendCount: recommend_count,
                isRecommended: !c.isRecommended,
              }
            : c
        )
      );
    } catch (err) {
      console.error("추천 처리 실패:", err);
    }
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
        setIsFavorite(isFavorited);
        alert(
          isFavorited ? "즐겨찾기 등록했습니다!" : "즐겨찾기를 해제했습니다!"
        );
      })
      .catch((err) => {
        console.error("즐겨찾기 실패:", err);
        alert("즐겨찾기 중 오류가 발생했습니다.");
      });
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/video/${video.id}`)
      .then((res) => res.json())
      .then((data) => setVideoInfo(data))
      .catch((err) => console.error("영상 정보 가져오기 실패:", err));
  }, [video.id]);

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

        <div className="video-side-wrapper">
          <div className="video-side-buttons">
            <button className="side-btn" onClick={handleAnalyzeClick}>
              <img src="/camera.png" alt="분석" />
            </button>
            <button className="side-btn" onClick={handleCartClick}>
              <img src="/cart.png" alt="장바구니" />
            </button>
            <button className="side-btn" onClick={toggleFavorite}>
              <img
                src={isFavorite ? "/star-filled.png" : "/star.png"}
                alt="즐겨찾기"
              />
            </button>

            <button className="side-btn" onClick={toggleRecommendation}>
              <img
                src={isRecommended ? "/thumb-filled.png" : "/thumb.png"}
                alt="추천"
              />
            </button>

            <button className="side-btn" onClick={() => setShowInfo(true)}>
              <img src="/info.png" alt="정보" />
            </button>
          </div>
        </div>
      </div>
      {showInfo && videoInfo && (
        <div className="info-modal">
          <div className="info-content">
            <button className="close-btn" onClick={() => setShowInfo(false)}>
              ×
            </button>
            <h2>영상 정보</h2>
            <p>
              <strong>제목:</strong> {videoInfo.title}
            </p>
            <p>
              <strong>설명:</strong> {videoInfo.description}
            </p>
            <p>
              <strong>영상 주소:</strong>{" "}
              <a
                href={videoInfo.video_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {videoInfo.video_url}
              </a>
            </p>
            <p>
              <strong>등록일:</strong>{" "}
              {new Date(videoInfo.upload_date).toLocaleString()}
            </p>
            <p>
              <strong>조회수:</strong> {videoInfo.views}회
            </p>
            <p>
              <strong>추천 수:</strong> {videoInfo.recommendations}회
            </p>
            {videoInfo.thumbnail_url && (
              <img src={videoInfo.thumbnail_url} alt="썸네일" />
            )}
            {videoInfo.correctable === 1 && (
              <p style={{ color: "green", fontWeight: "bold" }}>
                ✅ 이 영상은 자세 교정이 가능합니다.
              </p>
            )}
          </div>
        </div>
      )}

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
                <img className="avatar" src={comment.avatar} alt="프로필" />
                <div className="comment-body">
                  <div className="comment-header">
                    <div className="user-date-wrap">
                      <span className="user">{comment.user}</span>
                      <span className="date">{comment.date}</span>
                    </div>
                    <div className="like-section">
                      <button
                        className="like-btn"
                        onClick={() => handleRecommend(comment.id)}
                      >
                        <img
                          className="comment-like-icon"
                          src={
                            comment.isRecommended
                              ? "/thumb-filled.png"
                              : "/thumb.png"
                          }
                          alt="추천"
                        />
                      </button>
                      <span className="like-count">
                        {comment.recommendCount}
                      </span>
                    </div>
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
