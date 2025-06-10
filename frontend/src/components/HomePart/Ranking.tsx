import { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/Ranking.css";
import { useLocation } from "react-router-dom";

import trophyImg from "../../assets/trophy.png";

interface RankItem {
  rank: number;
  username: string;
  point: number;
}

const Ranking: React.FC = () => {
  const userId = localStorage.getItem("user_id") || "";
  const location = useLocation();
  const isRankingPage = location.pathname === "/ranking";

  const [myRank, setMyRank] = useState<{ rank: number; point: number } | null>(
    null
  );

  const [rankList, setRankList] = useState<RankItem[]>([]);

  useEffect(() => {
    if (!userId) {
      setMyRank({ rank: 0, point: 0 });
      setRankList([]);
      return;
    }

    // 내 순위 조회
    axios
      .post("/rank/my", { id: userId })
      .then((res) => {
        const data = res.data;
        if (data && "rank" in data && "point" in data) {
          setMyRank({
            rank: Number(data.rank) || 0,
            point: Number(data.point) || 0,
          });
        } else {
          setMyRank({ rank: 0, point: 0 });
        }
      })
      .catch((err) => {
        console.error("내 순위 조회 오류:", err);
        setMyRank({ rank: 0, point: 0 });
      });

    // 전체 랭킹 또는 Top5 조회
    const url = isRankingPage ? "/rank/all" : "/rank/top5";
    axios
      .get(url)
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          const parsed: RankItem[] = data.map((row: any) => ({
            rank: Number(row.rank) || 0,
            username: String(row.username ?? ""),
            point: Number(row.point) || 0,
          }));
          setRankList(parsed);
        } else {
          setRankList([]);
        }
      })
      .catch((err) => {
        console.error("랭킹 조회 오류:", err);
        setRankList([]);
      });
  }, [userId, isRankingPage]);

  return (
    <div className={isRankingPage ? "ranking-theme" : "left-panel"}>
      <div className={isRankingPage ? "ranking-page" : ""}>
        {/* ── 나의 포인트 순위 카드 ─ */}
        <div className="my-rank-card">
          <img src={trophyImg} alt="트로피" className="trophy" />
          <div className="my-rank-text">
            <div className="title">나의 포인트 순위</div>
            <div className="rank">{myRank ? `${myRank.rank}위` : "-위"}</div>
            <div className="point">{myRank ? `${myRank.point}점` : "0점"}</div>
          </div>
        </div>

        {/* ── 포인트 랭킹 카드 ─ */}
        <div className="top-rank-card">
          <div className="title">포인트 순위</div>
          <ul className="rank-list">
            {rankList.length > 0 ? (
              rankList.map((item) => (
                <li key={`${item.rank}-${item.username}`}>
                  <span className="rank-number">{item.rank}위</span>
                  <span className="rank-name">{item.username}</span>
                  <span className="rank-point">{item.point}점</span>
                </li>
              ))
            ) : (
              <li>순위 정보를 불러올 수 없습니다.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Ranking;
