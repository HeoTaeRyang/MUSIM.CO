// src/pages/Home.tsx
import "../styles/Home.css";
import MainCalendar from "./HomePart/MainCalendar";
import Ranking from "./HomePart/Ranking"; // 랭킹 컴포넌트 import

const Home = () => {
  const username = localStorage.getItem("username") || "사용자";

  return (
    <div className="dashboard">
      {/* 인삿말 */}
      <div className="greeting">
        <span className="username">{username}님!</span>
        <br />
        오늘도 건강한 하루 보내세요:D
      </div>

      <div className="main-panels">
        {/* 왼쪽: 포인트 랭킹 */}
        <Ranking />

        {/* 오른쪽: 출석 달력 */}
        <div className="right-panel">
          <MainCalendar />
        </div>
      </div>
    </div>
  );
};

export default Home;
