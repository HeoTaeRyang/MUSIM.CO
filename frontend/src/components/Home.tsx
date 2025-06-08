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
  const targetDailyMissionCount = 50;

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

  // 백엔드에서 데일리 미션 비디오 ID를 가져오는 함수 (현재 사용하지 않음)
  // const fetchDailyMissionVideoId = async (userId: string) => {
  //   try {
  //     const response = await axios.get(`/daily-mission-video-id`, { params: { user_id: userId } });
  //     const videoIdFromBackend = response.data.videoId || response.data;
  //     setDailyMissionVideoId(videoIdFromBackend); // 이 함수를 주석 해제하면 setDailyMissionVideoId 경고가 사라집니다.
  //   } catch (error) {
  //     console.error("데일리 미션 비디오 ID를 가져오는 데 실패했습니다.", error);
  //   }
  // };

  // 'completeDailyMissionItem' 함수는 더 이상 사용되지 않으므로 제거합니다.
  // 만약 DailyMission 컴포넌트에서 이 함수가 필요하다면,
  // DailyMission 컴포넌트 자체에서 이 함수를 정의하거나,
  // Home 컴포넌트에서 이 함수를 다시 추가하고 DailyMission 컴포넌트에 prop으로 전달해야 합니다.

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