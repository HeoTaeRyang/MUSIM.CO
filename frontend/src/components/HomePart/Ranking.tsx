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

const ITEMS_PER_PAGE = 15;

const Ranking: React.FC = () => {
  const userId = localStorage.getItem("user_id") || "";
  const location = useLocation();
  const isRankingPage = location.pathname === "/ranking";

  const [myRank, setMyRank] = useState<{ rank: number; point: number } | null>(null);
  const [rankList, setRankList] = useState<RankItem[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalPages = Math.ceil(rankList.length / ITEMS_PER_PAGE);
  const paginatedList = rankList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (!userId) {
      setMyRank({ rank: 0, point: 0 });
      setRankList([]);
      return;
    }

    axios.post("/rank/my", { id: userId })
      .then((res) => {
        const data = res.data;
        if (data && "rank" in data && "point" in data) {
          setMyRank({ rank: Number(data.rank), point: Number(data.point) });
        } else {
          setMyRank({ rank: 0, point: 0 });
        }
      })
      .catch((err) => {
        console.error("내 순위 조회 오류:", err);
        setMyRank({ rank: 0, point: 0 });
      });

    const url = isRankingPage ? "/rank/all" : "/rank/top5";
    axios.get(url)
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          const parsed: RankItem[] = data.map((row: any) => ({
            rank: Number(row.rank),
            username: String(row.username ?? ""),
            point: Number(row.point),
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
            {paginatedList.length > 0 ? (
              paginatedList.map((item) => (
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

          {/* 페이지네이션 버튼 */}
          {isRankingPage && totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-box">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`pagination-btn ${currentPage === i + 1 ? "active" : ""}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );


};

export default Ranking;
