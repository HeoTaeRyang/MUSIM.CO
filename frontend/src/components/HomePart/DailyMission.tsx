// src/pages/HomePart/DailyMission.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/DailyMission.css";
import flameIcon from "../../assets/flame.png";
import axios from "axios";

axios.defaults.baseURL = "https://web-production-6e732.up.railway.app";

type MissionKey = "crunch" | "leg_raise";

interface DailyMissionProps {
  missionName: string;
  currentCount: number;
  targetCount: number;
  missionKey: MissionKey;
}

const DailyMission: React.FC<DailyMissionProps> = ({
  missionName,
  currentCount,
  targetCount,
  missionKey,
}) => {
  const navigate = useNavigate();
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);
  const [isProcessingReward, setIsProcessingReward] = useState(false);

  useEffect(() => {
    setRewardMessage(null);
  }, [currentCount, targetCount]);

  const handleStartMission = () => {
    navigate("/daily-mission/select");
  };

  const handleReward = async () => {
    const rawUserId = localStorage.getItem("user_id");
    const userId = rawUserId ? rawUserId.trim() : "";
    const isMissionCompleted = currentCount >= targetCount;

    if (!userId) {
      setRewardMessage("로그인이 필요합니다.");
      return;
    }

    if (!isMissionCompleted) {
      setRewardMessage("미션 목표를 달성하지 못했습니다.");
      return;
    }

    if (isProcessingReward) return;

    setIsProcessingReward(true);
    setRewardMessage("보상 처리 중...");

    try {
      // ✔ crunch와 leg_raise 라우트 분기
      const endpoint =
        missionKey === "crunch"
          ? "/daily_mission/reward"
          : "/daily_mission/reward/leg_raise";

      // ✔ MUST: JSON 데이터 명시적으로 보내야 Flask가 request.json 안 놓침
      const payload = {
        user_id: userId,
        count: currentCount,
      };

      console.log("보상 요청 endpoint:", endpoint, payload);

      const response = await axios.post(endpoint, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("보상 API 응답:", response.data);

      if (response.data.success) {
        setRewardMessage("미션 성공! 보상을 받았습니다!");

        // ✔ 해당 운동 카운트만 초기화
        localStorage.setItem(`dailyMissionCount_${userId}_${missionKey}`, "0");

        // ✔ 새로고침
        window.location.reload();
      } else {
        setRewardMessage(
          `보상 실패: ${response.data.error || "알 수 없는 오류"}`
        );
      }
    } catch (error) {
      console.error("보상 API 호출 오류:", error);

      if (axios.isAxiosError(error) && error.response) {
        const data = error.response.data;
        console.error("보상 API 에러 응답:", data);
        setRewardMessage(`보상 오류: ${data?.error || error.message}`);
      } else {
        setRewardMessage(
          `보상 중 오류 발생: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    } finally {
      setIsProcessingReward(false);
    }
  };

  return (
    <div className="daily-mission-container">
      {/* 상단 카드 */}
      <div className="daily-mission-card top-card">
        <img src={flameIcon} alt="Flame" className="flame-icon" />
        <div className="daily-mission-right-content">
          <div className="mission-title">데일리미션</div>
          <button className="start-button" onClick={handleStartMission}>
            시작하기
          </button>
        </div>
      </div>

      {/* 하단 카드 */}
      <div className="daily-mission-card bottom-card">
        <div className="exercise-name">{missionName}</div>
        <div className="exercise-progress">
          {currentCount}/{targetCount}
        </div>

        <button
          className={`reward-button ${
            currentCount >= targetCount ? "active" : "inactive"
          }`}
          onClick={handleReward}
          disabled={!(currentCount >= targetCount) || isProcessingReward}
        >
          보상받기
        </button>

        {rewardMessage && <p className="reward-message">{rewardMessage}</p>}
      </div>
    </div>
  );
};

export default DailyMission;
