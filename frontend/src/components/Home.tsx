import { useState, useEffect } from "react";
import "../styles/Home.css";
import MainCalendar from "./HomePart/MainCalendar";
import Ranking from "./HomePart/Ranking";
import DailyMission from "./HomePart/DailyMission";

const Home = () => {
  const [username, setUsername] = useState("사용자");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    const storedUserId = localStorage.getItem("user_id");
    if (storedUsername) setUsername(storedUsername);
    if (storedUserId) setUserId(storedUserId);
  }, []);

  const dailyMissionName = "윗몸일으키기";
  const [currentDailyMissionCount, setCurrentDailyMissionCount] = useState(0);
  const targetDailyMissionCount = 50;
  const dailyMissionVideoId = "your_mission_exercise_video_id_here";

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
