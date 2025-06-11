import { useState, useEffect, useCallback } from "react";
import "../styles/Home.css";
import MainCalendar from "./HomePart/MainCalendar";
import Ranking from "./HomePart/Ranking";
import DailyMission from "./HomePart/DailyMission";
// import axios from 'axios'; // axios 임포트 주석 처리 (기존과 동일)

// axios.defaults.baseURL = "/"; // axios 기본 URL 설정 주석 처리 (기존과 동일)

const Home = () => {
  const [username, setUsername] = useState("사용자");
  const [userId, setUserId] = useState<string | null>(null);

  
  const dailyMissionVideoId: string = "1";

  const dailyMissionName = "윗몸일으키기";
  const targetDailyMissionCount = 5;

  // **** LOCAL STORAGE 관련 코드 시작 ****
  const getInitialDailyMissionCount = useCallback(() => {
    const storedUserId = localStorage.getItem("user_id");
    if (
      !storedUserId ||
      typeof storedUserId !== "string" ||
      storedUserId.trim() === ""
    ) {
      return 0;
    }
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
  // **** LOCAL STORAGE 관련 코드 끝 ****

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedUserId = localStorage.getItem("user_id");
    if (storedUsername) setUsername(storedUsername);
    if (storedUserId) setUserId(storedUserId);
  }, []);


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

        <DailyMission
          missionName={dailyMissionName}
          currentCount={currentDailyMissionCount}
          targetCount={targetDailyMissionCount}
          videoId={dailyMissionVideoId}
        />

        <div className="right-panel">
          {userId && <MainCalendar userId={userId} />}
        </div>
      </div>
    </div>
  );
};

export default Home;