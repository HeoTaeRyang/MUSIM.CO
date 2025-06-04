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

  // "내 순위": { rank, point } 혹은 null
  const [myRank, setMyRank] = useState<{ rank: number; point: number } | null>(
    null
  );

  // "상위 5명": RankItem[]
  const [top5, setTop5] = useState<RankItem[]>([]);

  useEffect(() => {
    // 1) userId가 없으면 기본값 세팅 후 종료
    if (!userId) {
      setMyRank({ rank: 0, point: 0 });
      setTop5([]);
      return;
    }

    // ── 2) 내 순위 조회 (POST /rank/my) ─────────────────────────────
    axios
      .post("/rank/my", { id: userId })
      .then((res) => {
        const data = res.data;
        console.log("/rank/my 응답:", data);

        // 객체 형태로 { id, username, point, rank }
        if (
          data &&
          typeof data === "object" &&
          "rank" in data &&
          "point" in data
        ) {
          setMyRank({
            rank: Number((data as any).rank) || 0,
            point: Number((data as any).point) || 0,
          });
        } else {
          setMyRank({ rank: 0, point: 0 });
        }
      })
      .catch((err) => {
        console.error("내 순위 조회 중 오류:", err);
        setMyRank({ rank: 0, point: 0 });
      });

    // ── 3) 상위 5명 조회 (GET /rank/top5) ───────────────────────────
    axios
      .get("/rank/top5")
      .then((res) => {
        const data = res.data;
        console.log("/rank/top5 응답:", data);

        // 객체 배열 형태로 전달받음음
        if (
          Array.isArray(data) &&
          data.length > 0 &&
          typeof data[0] === "object"
        ) {
          const parsed: RankItem[] = data.map((row: any) => ({
            rank: Number(row.rank) || 0,
            username: String(row.username ?? ""),
            point: Number(row.point) || 0,
          }));
          setTop5(parsed);
        }
        // 예상치 못한 형태
        else {
          console.warn("예상치 못한 top5 응답 형태:", data);
          setTop5([]);
        }
      })
      .catch((err) => {
        console.error("상위 5명 조회 중 오류:", err);
        setTop5([]);
      });
  }, [userId]);

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

        {/* ── 사이트 전체 포인트 순위 Top5 ─ */}
        <div className="top-rank-card">
          <div className="title">포인트 순위</div>
          <ul className="rank-list">
            {top5.length > 0 ? (
              top5.map((item) => (
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
