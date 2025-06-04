// src/pages/HomePart/DailyMission.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/DailyMission.css';
import flameIcon from '../../assets/flame.png';

interface DailyMissionProps {
  missionName: string;
  currentCount: number;
  targetCount: number;
  videoId: string;
}

const DailyMission: React.FC<DailyMissionProps> = ({
  missionName,
  currentCount,
  targetCount,
  videoId,
}) => {
  const navigate = useNavigate();

  const handleStartMission = () => {
    console.log(`Navigating to /DailyMissionVideo/${videoId} with mission data`);
    navigate(
      `/DailyMissionVideo/${videoId}`, // <--- URL 경로를 /DailyMissionVideo/{videoId}로 변경
      {
        state: { // 미션 정보를 state 객체로 전달 (이전과 동일)
          missionName: missionName,
          currentCount: currentCount,
          targetCount: targetCount,
        }
      }
    );
  };

  return (
    <div className="daily-mission-container">
      {/* 상단 카드: 데일리 미션 시작 */}
      <div className="daily-mission-card top-card">
        <img src={flameIcon} alt="Flame" className="flame-icon" />

        <div className="daily-mission-right-content">
          <div className="mission-title">데일리미션</div>
          <button
            className="start-button"
            onClick={handleStartMission}
          >
            시작하기
          </button>
        </div>
      </div>

      {/* 하단 카드: 운동 미션 진행 상황 */}
      <div className="daily-mission-card bottom-card">
        <div className="exercise-name">{missionName}</div>
        <div className="exercise-progress">{currentCount}/{targetCount}</div>
      </div>
    </div>
  );
};

export default DailyMission;