import { useState, useEffect } from "react"; // useEffect 추가 (username 가져오기 로직 때문)
import "../styles/Home.css"; // 홈 페이지의 CSS 파일 import
import MainCalendar from "./HomePart/MainCalendar"; // MainCalendar 컴포넌트 import
import Ranking from "./HomePart/Ranking"; // Ranking 컴포넌트 import
import DailyMission from "./HomePart/DailyMission"; // DailyMission 컴포넌트 import

const Home = () => {
  // username 상태 관리 (undefined님! 문제 해결을 위해 useEffect 사용)
  const [username, setUsername] = useState("사용자");

  useEffect(() => {
    const username = localStorage.getItem("username"); // localStorage에서 "user" 키로 저장된 값 가져오기
    if (username) {
      setUsername(username); // 가져온 값을 상태에 저장
    } else {
      setUsername("사용자"); // 값이 없으면 기본값으로 "사용자" 설정
    }
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // 데일리 미션의 상태를 관리하기 위한 예시입니다.
  // 실제 애플리케이션에서는 백엔드에서 데이터를 가져오거나,
  // 더 복잡한 전역 상태 관리(Redux, Zustand 등)를 사용할 수 있습니다.
  const dailyMissionName = "윗몸일으키기"; // 데일리 미션의 이름
  const [currentDailyMissionCount, setCurrentDailyMissionCount] = useState(0); // 현재 달성 횟수 상태
  const targetDailyMissionCount = 50; // 목표 횟수

  // <--- 중요: 이 부분은 백엔드에서 받아와야 할 실제 비디오 ID입니다.
  // 현재는 예시로 고정된 값을 사용합니다.
  const dailyMissionVideoId = "your_mission_exercise_video_id_here"; // <-- !!!! 이 값을 실제 비디오 ID로 변경해야 합니다. !!!!
  // 예: "pushup-video-id", "squat-video-id" 등
  // 이 부분은 특정 미션에 대한 비디오 ID를 동적으로 가져오는 로직으로 대체되어야 합니다.
  // (예: 백엔드 API 호출로 '윗몸일으키기' 미션의 비디오 ID를 가져옴)

  // (이전의 handleDailyMissionStart 함수는 DailyMission 내부에서 직접 내비게이션을 처리하므로 더 이상 여기서는 필요 없습니다.)

  // (선택 사항) 데일리 미션 진행 상황을 시뮬레이션하기 위한 함수입니다.
  // 실제로는 운동 완료 등 특정 액션에 의해 이 카운트가 증가할 것입니다.
  // 이 함수는 이 예시에서는 직접 호출되지 않지만, 다른 컴포넌트에서 미션 진행도를 업데이트할 때 사용될 수 있습니다.
  const completeDailyMissionItem = () => {
    if (currentDailyMissionCount < targetDailyMissionCount) {
      setCurrentDailyMissionCount((prev) => prev + 1); // 현재 횟수 1 증가
    }
  };

  return (
    <div className="dashboard">
      {/* 인삿말 섹션 */}
      <div className="greeting">
        <span className="username">{username}님!</span>
        <br />
        오늘도 건강한 하루 보내세요:D
      </div>

      {/* 주요 패널들을 담는 컨테이너 (랭킹, 데일리 미션, 달력) */}
      <div className="main-panels">
        {/* 왼쪽: 포인트 랭킹 컴포넌트 */}
        <Ranking />

        {/* 중간: 데일리 미션 컴포넌트 */}
        <DailyMission
          missionName={dailyMissionName}
          currentCount={currentDailyMissionCount}
          targetCount={targetDailyMissionCount}
          videoId={dailyMissionVideoId} // <--- 추가: videoId props 전달
        // onStartMission={handleDailyMissionStart} // <--- 제거: 더 이상 이 props는 필요 없습니다.
        />

        {/* 오른쪽: 출석 달력 컴포넌트 */}
        <div className="right-panel">
          <MainCalendar />
        </div>
      </div>

      {/*
        // 데일리 미션 진행을 테스트하기 위한 임시 버튼입니다.
        // 실제 앱에서는 필요 없을 수 있으며, 운동 완료 같은 다른 액션에 의해
        // `currentDailyMissionCount`가 업데이트될 것입니다
        <button
          onClick={completeDailyMissionItem}
          style={{
            marginTop: '20px',
            padding: '10px 15px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          윗몸 일으키기 1회 추가 (테스트용)
        </button>
      */}
    </div>
  );
};

export default Home;