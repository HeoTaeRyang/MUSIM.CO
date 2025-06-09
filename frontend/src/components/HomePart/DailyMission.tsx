// src/pages/HomePart/DailyMission.tsx
import React, { useState, useEffect } from "react"; // useEffect도 필요, currentCount 변경 감지
import { useNavigate } from "react-router-dom";
import "../../styles/DailyMission.css";
import flameIcon from "../../assets/flame.png";
import axios from "axios";

axios.defaults.baseURL = "https://web-production-6e732.up.railway.app";

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
  // 보상 메시지 상태
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);
  // 보상 버튼 클릭으로 API 호출 중인지 여부 (중복 클릭 방지)
  const [isProcessingReward, setIsProcessingReward] = useState(false);

  // currentCount나 targetCount가 변경될 때마다 rewardMessage 초기화
  // (예: 미션 진행 중 횟수가 증가하면 이전 보상 메시지 숨김)
  useEffect(() => {
    setRewardMessage(null);
  }, [currentCount, targetCount]);

  const handleStartMission = () => {
    console.log(
      `Navigating to /DailyMissionVideo/${videoId} with mission data`
    );
    navigate(`/DailyMissionVideo/${videoId}`, {
      state: {
        missionName: missionName,
        currentCount: currentCount,
        targetCount: targetCount,
      },
    });
  };

  const handleReward = async () => {
    const userId = localStorage.getItem("user_id");
    const isMissionCompleted = currentCount >= targetCount;

    if (!userId) {
      setRewardMessage("로그인이 필요합니다.");
      return;
    }

    if (!isMissionCompleted) {
      setRewardMessage("미션 목표를 달성하지 못했습니다.");
      return;
    }

    if (isProcessingReward) {
      // 중복 클릭 방지
      return;
    }

    setIsProcessingReward(true); // 보상 처리 시작
    setRewardMessage("보상 처리 중...");

    try {
      const response = await axios.post("/daily_mission/reward", {
        user_id: userId,
      });

      if (response.data.success) {
        setRewardMessage("미션 성공! 보상을 받았습니다!");
        // 보상을 받은 후 localStorage의 횟수를 0으로 초기화
        localStorage.setItem(`dailyMissionCount_${userId}`, "0");
        // 페이지 새로고침하여 Home 컴포넌트의 currentCount를 업데이트 (가장 간단한 방법)
        window.location.reload();
      } else {
        setRewardMessage(
          `보상 실패: ${response.data.error || "알 수 없는 오류"}`
        );
      }
    } catch (error) {
      console.error("보상 API 호출 오류:", error);
      if (axios.isAxiosError(error) && error.response) {
        setRewardMessage(
          `보상 오류: ${error.response.data.error || error.message}`
        );
      } else {
        setRewardMessage(
          `보상 중 오류 발생: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    } finally {
      setIsProcessingReward(false); // 보상 처리 완료 (성공/실패 무관)
    }
  };

  return (
    <div className="daily-mission-container">
            {/* 상단 카드: 데일리 미션 시작 */}     {" "}
      <div className="daily-mission-card top-card">
                <img src={flameIcon} alt="Flame" className="flame-icon" />     
         {" "}
        <div className="daily-mission-right-content">
                    <div className="mission-title">데일리미션</div>         {" "}
          <button className="start-button" onClick={handleStartMission}>
                        시작하기          {" "}
          </button>
                 {" "}
        </div>
             {" "}
      </div>
            {/* 하단 카드: 운동 미션 진행 상황 */}     {" "}
      <div className="daily-mission-card bottom-card">
                <div className="exercise-name">{missionName}</div>       {" "}
        <div className="exercise-progress">
          {currentCount}/{targetCount}
        </div>
        {/* 보상받기 버튼: 항상 표시, 조건부 활성화/스타일 */}
        <button
          // 50개 미만일 때, 또는 보상 처리 중일 때 비활성화
          className={`reward-button ${
            currentCount >= targetCount ? "active" : "inactive"
          }`}
          onClick={handleReward}
          disabled={!(currentCount >= targetCount) || isProcessingReward}
        >
          보상받기
        </button>
        {rewardMessage && <p className="reward-message">{rewardMessage}</p>}   
         {" "}
      </div>
         {" "}
    </div>
  );
};

export default DailyMission;
