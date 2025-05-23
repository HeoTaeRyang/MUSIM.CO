import React from "react";
import { useNavigate } from "react-router-dom";

// 더미 영상 데이터 예시
const videos = [
  {
    id: "video1",
    title: "집에서 근력 운동",
    thumb: "/src/assets/sample_thumbnail.png",
    video: "/src/assets/sample_video.mp4",
  },
];

const Exercise: React.FC = () => {
  const navigate = useNavigate();

  const handleThumbnailClick = (video) => {
    // 비디오 정보 state로 함께 전달!
    navigate(`/video/${video.id}`, { state: { video } });
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>오늘의 추천 영상</h2>
      <div style={{ display: "flex", gap: 24 }}>
        {videos.map((v) => (
          <div
            key={v.id}
            style={{
              width: 220,
              border: "1px solid #eee",
              borderRadius: 14,
              padding: 12,
              cursor: "pointer",
            }}
            onClick={() => handleThumbnailClick(v)}
          >
            <img
              src={v.thumb}
              alt={v.title}
              style={{ width: "100%", borderRadius: 10 }}
            />
            <div style={{ marginTop: 10 }}>{v.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Exercise;
