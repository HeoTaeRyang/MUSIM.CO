// src/pages/Home.tsx
import { useState, useEffect, useCallback } from "react";
import "../styles/Home.css";
import MainCalendar from "./HomePart/MainCalendar";
import Ranking from "./HomePart/Ranking";
import DailyMission from "./HomePart/DailyMission";

// 백엔드 DailyMission.type 과 1:1로 맞출 운동 키
type MissionKey = "crunch" | "leg_raise";

type Mission = {
  name: string;
  targetCount: number;
  videoId: string; // 지금은 미션 선택 페이지 이동용
  key: MissionKey;
};

const missions: Mission[] = [
  { name: "윗몸일으키기", targetCount: 5, videoId: "1", key: "crunch" },
  { name: "레그레이즈", targetCount: 8, videoId: "2", key: "leg_raise" },
];

const Home = () => {
  const [username, setUsername] = useState("사용자");
  const [userId, setUserId] = useState<string | null>(null);

  const [missionIndex, setMissionIndex] = useState(0);
  const currentMission = missions[missionIndex];

  // ✅ 운동별로 localStorage에서 카운트 읽기
  const getDailyMissionCount = useCallback((missionKey: MissionKey) => {
    const storedUserId = localStorage.getItem("user_id");
    if (!storedUserId) return 0;

    const storedCount = localStorage.getItem(
      `dailyMissionCount_${storedUserId}_${missionKey}`
    );
    const parsedCount = storedCount ? parseInt(storedCount, 10) : 0;
    return isNaN(parsedCount) ? 0 : parsedCount;
  }, []);

  const [currentDailyMissionCount, setCurrentDailyMissionCount] = useState(() =>
    getDailyMissionCount(currentMission.key)
  );

  // userId나 현재 미션이 바뀔 때마다 카운트 다시 읽기
  useEffect(() => {
    setCurrentDailyMissionCount(getDailyMissionCount(currentMission.key));
  }, [userId, missionIndex, currentMission.key, getDailyMissionCount]);

  // 사용자 정보 로딩
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedUserId = localStorage.getItem("user_id");
    if (storedUsername) setUsername(storedUsername);
    if (storedUserId) setUserId(storedUserId);
  }, []);

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

        <div className="daily-mission-wrapper">
          <button className="arrow left-arrow" onClick={handlePrevMission}>
            ◀
          </button>

          <DailyMission
            missionName={currentMission.name}
            currentCount={currentDailyMissionCount}
            targetCount={currentMission.targetCount}
            missionKey={currentMission.key} // ✅ 보상 API 선택용
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
