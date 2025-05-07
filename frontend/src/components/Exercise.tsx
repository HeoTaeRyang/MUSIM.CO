import "../styles/Exercise.css";
import { useState, useEffect } from "react";


const Fitness = () => {
    const [sortType, setSortType] = useState("recent");

  // 예시 데이터 (16개 더미 이미지)
  const images = [
    { id: 1, views: 120, likes: 30, date: "2025-05-01" },
    { id: 2, views: 80, likes: 50, date: "2025-04-30" },
    // ... 총 16개
  ];

  // 정렬 로직
  const sortedImages = [...images].sort((a, b) => {
    if (sortType === "recent") return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortType === "like") return b.likes - a.likes;
    if (sortType === "watch") return b.views - a.views;
    return 0;
  });
    return (
        <div className="ex-container">
            <div style={{textAlign:"left",width:"1080px"}}><h1>오늘의 운동추천</h1></div>
            
            <img src="https://placehold.co/1080x720" style={{width:"1080px",height:"720px"}} alt="더미 이미지" />

            <table className="sort-table">
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
      </table>
       <div className="image-grid">
       {[...Array(16)].map((_, i) => (
      <img
      key={i}
      src={`https://placehold.co/320x240?text=Image+${i + 1}`}
      alt={`Image ${i + 1}`}
      />
      ))}
</div>
    
    
        </div>
    );
};

export default Fitness;