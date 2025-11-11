// src/pages/Home.tsx
import { useState, useEffect, useCallback } from "react";
import "../styles/Home.css";
import MainCalendar from "./HomePart/MainCalendar";
import Ranking from "./HomePart/Ranking";
import DailyMission from "./HomePart/DailyMission";

const Home = () => {
  const [username, setUsername] = useState("사용자");
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ 여러 미션 목록 정의
  const missions = [
    { name: "윗몸일으키기", targetCount: 5, videoId: "1" },
    { name: "레그레이즈", targetCount: 8, videoId: "2" },
  ];

  const [missionIndex, setMissionIndex] = useState(0);
  const currentMission = missions[missionIndex];

  const getInitialDailyMissionCount = useCallback(() => {
    const storedUserId = localStorage.getItem("user_id");
    if (!storedUserId) return 0;
    const storedCount = localStorage.getItem(
      `dailyMissionCount_${storedUserId}`
    );
    const parsedCount = storedCount ? parseInt(storedCount, 10) : 0;
    return isNaN(parsedCount) ? 0 : parsedCount;
  }, []);

  const [currentDailyMissionCount, setCurrentDailyMissionCount] = useState(
    getInitialDailyMissionCount()
  );

  useEffect(() => {
    setCurrentDailyMissionCount(getInitialDailyMissionCount());
  }, [userId, getInitialDailyMissionCount]);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedUserId = localStorage.getItem("user_id");
    if (storedUsername) setUsername(storedUsername);
    if (storedUserId) setUserId(storedUserId);
  }, []);

  // ✅ 미션 전환 함수
  const handlePrevMission = () => {
    setMissionIndex((prev) => (prev === 0 ? missions.length - 1 : prev - 1));
  };

  const handleNextMission = () => {
    setMissionIndex((prev) => (prev === missions.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="dashboard">
      <div className="greeting">
        <span className="username">{username}님!</span>
        <br />
        오늘도 건강한 하루 보내세요:D
      </div>

      <div className="main-panels">
        <div className="left-panel">
          <Ranking />
        </div>

        {/* ✅ 미션 이름 좌우 화살표 */}
        <div className="daily-mission-wrapper">
          <button className="arrow left-arrow" onClick={handlePrevMission}>
            ◀
          </button>

          <DailyMission
            missionName={currentMission.name}
            currentCount={currentDailyMissionCount}
            targetCount={currentMission.targetCount}
            videoId={currentMission.videoId}
          />

          <button className="arrow right-arrow" onClick={handleNextMission}>
            ▶
          </button>
        </div>

        <div className="right-panel">
          {userId && <MainCalendar userId={userId} />}
        </div>
      </div>
    </div>
  );
};

export default Home;
