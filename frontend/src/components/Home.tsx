import { useState, useEffect } from "react";
import "../styles/Home.css";
import MainCalendar from "./HomePart/MainCalendar";
import Ranking from "./HomePart/Ranking";
import DailyMission from "./HomePart/DailyMission";
// import axios from 'axios'; // axios 임포트 주석 처리

// axios.defaults.baseURL = "/"; // axios 기본 URL 설정 주석 처리

const Home = () => {
  const [username, setUsername] = useState("사용자");
  const [userId, setUserId] = useState<string | null>(null);

  // dailyMissionVideoId의 초기값을 '1' (더미 ID)로 설정했습니다.
  const [dailyMissionVideoId, setDailyMissionVideoId] = useState<string | null>("1");

  const dailyMissionName = "윗몸일으키기";
  const [currentDailyMissionCount, setCurrentDailyMissionCount] = useState(0);
  const targetDailyMissionCount = 50;

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedUserId = localStorage.getItem("user_id");
    if (storedUsername) setUsername(storedUsername);
    if (storedUserId) setUserId(storedUserId);

    // 백엔드 API 호출 로직은 주석 처리합니다.
    // if (storedUserId) {
    //   fetchDailyMissionVideoId(storedUserId);
    // }
  }, []);

  // 백엔드에서 데일리 미션 비디오 ID를 가져오는 함수 (현재 사용하지 않음)
  // const fetchDailyMissionVideoId = async (userId: string) => {
  //   try {
  //     // TODO: 실제 백엔드 API 엔드포인트로 변경해야 합니다.
  //     // 예시: GET /api/daily-mission-video-id?userId=...
  //     const response = await axios.get(`/daily-mission-video-id`, { params: { user_id: userId } });
  //     const videoIdFromBackend = response.data.videoId || response.data;

  //     setDailyMissionVideoId(videoIdFromBackend);

  //   } catch (error) {
  //     console.error("데일리 미션 비디오 ID를 가져오는 데 실패했습니다.", error);
  //     // 실패 시 더미 값 '1'이 유지됩니다.
  //   }
  // };

  const completeDailyMissionItem = () => {
    if (currentDailyMissionCount < targetDailyMissionCount) {
      setCurrentDailyMissionCount((prev) => prev + 1);
    }
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

        {/* dailyMissionVideoId는 항상 '1'이므로 DailyMission이 항상 렌더링됩니다. */}
        <DailyMission
          missionName={dailyMissionName}
          currentCount={currentDailyMissionCount}
          targetCount={targetDailyMissionCount}
          videoId={dailyMissionVideoId} // <-- 더미 ID '1'이 전달됩니다.
        />

        <div className="right-panel">
          {userId && <MainCalendar userId={userId} />}
        </div>
      </div>
    </div>
  );
};

export default Home;