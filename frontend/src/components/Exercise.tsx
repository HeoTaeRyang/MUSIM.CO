import "../styles/Exercise.css";
import { useState } from "react";
import exeMainImage from "../assets/exe_main.png"; // 상대 경로로 import


const Fitness = () => {
  const [sortType, setSortType] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");

  // 예시 데이터 (16개)
  const images = [
    { id: 1, views: 120, likes: 30, date: "2025-05-01", title: "하체운동" },
    { id: 2, views: 80, likes: 50, date: "2025-04-30", title: "상체 스트레칭" },
    { id: 3, views: 200, likes: 80, date: "2025-04-25", title: "플랭크 챌린지" },
    { id: 4, views: 95, likes: 20, date: "2025-05-02", title: "팔 운동 루틴" },
    // 나머지 더미 데이터 추가 ...
  ];

  // 검색 + 정렬된 이미지
  const filteredAndSortedImages = images
    .filter((img) => img.title.includes(searchQuery))
    .sort((a, b) => {
      if (sortType === "recent") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortType === "like") return b.likes - a.likes;
      if (sortType === "watch") return b.views - a.views;
      return 0;
    });

  return (
    <div className="ex-container">
      

      {/* 메인 배너 이미지 */}
<div style={{ position: "relative", width: "1080px", height: "720px"  }}>
  <img
    src={exeMainImage} // 또는 "/assets/exe_main.png"
    style={{ width: "100%", height: "100%", objectFit: "cover" }}
    alt="운동 이미지"
  />

  {/* 젤 위 */}
  <div
    style={{
      position: "absolute",
      top: "20px",
      left: "25%",
      transform: "translateX(-50%)",
      color: "white",
      fontSize: "64px",
      fontWeight: "bold",
      textShadow: "2px 2px 5px rgba(0,0,0,0.7)"
    }}
  >
    오늘의 추천 영상
  </div>

  {/* 젤 아래에서 2번째 */}
  <div
    style={{
      position: "absolute",
      bottom: "130px",
      left: "15%",
      transform: "translateX(-50%)",
      color: "white",
      fontSize: "64px",
      fontWeight: "500",
      textShadow: "1px 1px 4px rgba(0,0,0,0.6)"
    }}
  >
    집에서도
  </div>

  {/* 젤 아래 */}
  <div
    style={{
      position: "absolute",
      bottom: "20px",
      left: "35%",
      transform: "translateX(-50%)",
      color: "transparent",
      WebkitTextStroke:  "3px #034DD2", // 파란 외곽선
      fontSize: "100px",
      fontWeight: "normal",
      
    }}
  >
    전신 근력 유산소
  </div>
</div>

      {/* 🔍 검색창 */}
      <div style={{ margin: "20px 0", textAlign: "left", width: "1080px" }}>
        <input
          type="text"
          placeholder="검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          style={{
            width: "100%",
            padding: "10px 15px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            fontSize: "16px",
          }}
        />
      </div>

      {/* 정렬 라디오 버튼 */}
      <table className="sort-table">
        <tbody>
          <tr>
            <th>
              <label>
                <input
                  type="radio"
                  name="sort"
                  value="recent"
                  checked={sortType === "recent"}
                  onChange={() => setSortType("recent")}
                />
                최신순
              </label>
            </th>
            <th>
              <label>
                <input
                  type="radio"
                  name="sort"
                  value="like"
                  checked={sortType === "like"}
                  onChange={() => setSortType("like")}
                />
                추천순
              </label>
            </th>
            <th>
              <label>
                <input
                  type="radio"
                  name="sort"
                  value="watch"
                  checked={sortType === "watch"}
                  onChange={() => setSortType("watch")}
                />
                조회순
              </label>
            </th>
          </tr>
        </tbody>
      </table>

      {/* 이미지 그리드 */}
      <div className="image-grid">
        {filteredAndSortedImages.map((img) => (
          <div key={img.id} style={{ textAlign: "center" }}>
            <img
              src={`https://placehold.co/320x240?text=Image+${img.id}`}
              alt={img.title}
              style={{ marginBottom: "8px" }}
            />
            <div>{img.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Fitness;
