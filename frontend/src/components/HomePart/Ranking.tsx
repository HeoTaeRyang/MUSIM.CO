// src/components/Ranking.tsx
import { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/Ranking.css";

import trophyImg from "../../assets/trophy.png";

interface RankItem {
  rank: number;
  username: string;
  score: number;
}

const Ranking = () => {
  const userId = localStorage.getItem("user_id") || "";
  const [myRank, setMyRank] = useState<{ rank: number; score: number } | null>(
    null
  );
  const [top5, setTop5] = useState<RankItem[]>([]);

  useEffect(() => {
    axios
      .get("/points/myRank", { params: { user_id: userId } })
      .then((res) => {
        const data = res.data;
        setMyRank({ rank: data.rank, score: data.score });
      })
      .catch(() => setMyRank({ rank: 0, score: 0 }));

    axios
      .get("/points/top5")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setTop5(res.data);
        } else if (Array.isArray(res.data.top5)) {
          setTop5(res.data.top5);
        } else {
          setTop5([]);
        }
      })
      .catch(() => setTop5([]));
  }, [userId]);

  return (
    <div className="left-panel">
      <div className="my-rank-card">
        <img src={trophyImg} alt="트로피" className="trophy" />
        <div className="my-rank-text">
          <div className="title">나의 포인트 순위</div>
          <div className="rank">{myRank ? `${myRank.rank}위` : "-위"}</div>
          <div className="score">{myRank ? `${myRank.score}점` : "0점"}</div>
        </div>
      </div>

      <div className="top-rank-card">
        <div className="title">포인트 순위</div>
        <ul className="rank-list">
          {top5.map((item) => (
            <li key={item.rank}>
              <span className="rank-number">{item.rank}위</span>
              <span className="rank-name">{item.username}</span>
              <span className="rank-score">{item.score}점</span>
            </li>
          ))}
          {top5.length === 0 && <li>순위 정보를 불러올 수 없습니다.</li>}
        </ul>
      </div>
    </div>
  );
};

export default Ranking;
