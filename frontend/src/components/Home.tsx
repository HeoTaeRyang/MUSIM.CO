import { useState, useEffect, useCallback } from "react"; // useCallback 추가
import "../styles/Home.css";
import MainCalendar from "./HomePart/MainCalendar";
import Ranking from "./HomePart/Ranking";
import DailyMission from "./HomePart/DailyMission";
// import axios from 'axios'; // axios 임포트 주석 처리 (기존과 동일)

// axios.defaults.baseURL = "/"; // axios 기본 URL 설정 주석 처리 (기존과 동일)

const Home = () => {
  const [username, setUsername] = useState("사용자");
  const [userId, setUserId] = useState<string | null>(null);

  // dailyMissionVideoId의 초기값을 '1' (더미 ID)로 설정했습니다.
  const [dailyMissionVideoId, setDailyMissionVideoId] = useState<string | null>("1"); 

  const dailyMissionName = "윗몸일으키기";
  const targetDailyMissionCount = 50;
  
  // **** LOCAL STORAGE 관련 코드 시작 ****
  // Home 컴포넌트 내에서 localStorage에서 횟수를 불러오는 함수
  const getInitialDailyMissionCount = useCallback(() => {
    const storedUserId = localStorage.getItem("user_id");
    // userId가 유효한 문자열이 아닐 경우 0 반환
    if (!storedUserId || typeof storedUserId !== 'string' || storedUserId.trim() === '') {
      return 0;
    }
    // DailyMissionVideo.tsx에서 사용한 동일한 키로 localStorage에서 횟수를 가져옵니다.
    const storedCount = localStorage.getItem(`dailyMissionCount_${storedUserId}`);
    const parsedCount = storedCount ? parseInt(storedCount, 10) : 0;
    return isNaN(parsedCount) ? 0 : parsedCount;
  }, []); // 이 함수는 userId가 변경될 때마다 재생성될 필요가 없으므로 빈 배열

  // currentDailyMissionCount 상태를 localStorage에서 불러온 값으로 초기화
  const [currentDailyMissionCount, setCurrentDailyMissionCount] = useState(getInitialDailyMissionCount());

  // useEffect를 사용하여 userId가 변경될 때 currentDailyMissionCount를 다시 로드하거나
  // DailyMissionVideo.tsx에서 업데이트된 값을 반영하도록 할 수 있습니다.
  // 이 부분은 이미 useState의 초기화에서 처리되므로, Home 컴포넌트가 다시 마운트될 때마다 최신 값을 가져옵니다.
  // 만약 Home 컴포넌트가 마운트된 상태에서 DailyMissionVideo 컴포넌트의 currentCount가 변경되었을 때
  // Home 컴포넌트에서도 즉시 반영되기를 원한다면 더 복잡한 Real-time 동기화 로직 (예: Context API, Redux, 또는 Custom Hook 내 구독)이 필요합니다.
  // 하지만 "페이지를 다시 방문했을 때 최신 횟수를 보여준다"는 목적에는 현재 로직으로 충분합니다.
  useEffect(() => {
    // userId가 변경될 때 (로그인/로그아웃 등) 미션 카운트를 다시 불러옴
    setCurrentDailyMissionCount(getInitialDailyMissionCount());
  }, [userId, getInitialDailyMissionCount]); // userId나 함수가 변경될 때 재실행
  // **** LOCAL STORAGE 관련 코드 끝 ****


  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedUserId = localStorage.getItem("user_id"); // 여기서 userId를 다시 가져와서 상태에 설정
    if (storedUsername) setUsername(storedUsername);
    if (storedUserId) setUserId(storedUserId); // userId 상태 업데이트
  }, []);

  // 백엔드에서 데일리 미션 비디오 ID를 가져오는 함수 (현재 사용하지 않음)
  // const fetchDailyMissionVideoId = async (userId: string) => {
  //   try {
  //     const response = await axios.get(`/daily-mission-video-id`, { params: { user_id: userId } });
  //     const videoIdFromBackend = response.data.videoId || response.data;
  //     setDailyMissionVideoId(videoIdFromBackend);
  //   } catch (error) {
  //     console.error("데일리 미션 비디오 ID를 가져오는 데 실패했습니다.", error);
  //   }
  // };

  // 이 함수는 이제 DailyMissionVideo에서 횟수를 업데이트하므로,
  // Home 컴포넌트에서는 직접 횟수를 변경할 필요가 없습니다.
  const completeDailyMissionItem = () => {
    // 이 함수는 이제 사용되지 않습니다.
    // if (currentDailyMissionCount < targetDailyMissionCount) {
    //   setCurrentDailyMissionCount((prev) => prev + 1);
    // }
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

        <DailyMission
          missionName={dailyMissionName}
          currentCount={currentDailyMissionCount} // localStorage에서 불러온 값이 전달됩니다.
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