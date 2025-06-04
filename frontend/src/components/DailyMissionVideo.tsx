// src/components/DailyMissionVideo.tsx
import React, { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import "../styles/DailyMissionVideo.css"; // CSS 파일 import 확인
import axios from "axios";
import classNames from "classnames";

import flameIcon from '../assets/flame.png';
import '../styles/DailyMission.css'; // 데일리 미션 카드 기본 스타일을 위해 필요

axios.defaults.baseURL = "/";

const DailyMissionVideo: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const id = Number(videoId);

  const location = useLocation();

  const [showCameraFeed, setShowCameraFeed] = useState(false);
  const [resultText, setResultText] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const userId = localStorage.getItem("user_id") || "";

  const [dailyMissionDisplayData, setDailyMissionDisplayData] = useState<{
    missionName: string;
    currentCount: number;
    targetCount: number;
  } | null>(null);

  useEffect(() => {
    if (location.state && typeof location.state === 'object' && 'missionName' in location.state) {
      const { missionName, currentCount, targetCount } = location.state as {
        missionName: string;
        currentCount: number;
        targetCount: number;
      };
      setDailyMissionDisplayData({ missionName, currentCount, targetCount });
    } else {
      setDailyMissionDisplayData(null);
      console.warn("Daily mission data not found in location state. Hiding daily mission box.");
    }
  }, [id, userId, location.state]);

  const startLiveCamera = async () => {
    setShowCameraFeed(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setResultText("실시간 촬영 중입니다.");
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      setResultText("카메라에 접근할 수 없습니다. 권한을 확인해주세요.");
    }
  };

  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="page-center-container">
      <div className="video-analyze-container">
        {dailyMissionDisplayData && (
          <div className="daily-mission-card top-card video-analyze-mission-display">
            <img src={flameIcon} alt="Flame" className="flame-icon" />
            <div className="daily-mission-right-content">
              <div className="mission-title">데일리미션</div>
              <div className="exercise-progress">
                {dailyMissionDisplayData.missionName} {dailyMissionDisplayData.currentCount}/{dailyMissionDisplayData.targetCount}
              </div>
            </div>
          </div>
        )}

        <div className="panels">
          <div className="camera-control-area">
            {!showCameraFeed ? (
              <button className="start-camera-button" onClick={startLiveCamera}>
                실시간 촬영 시작하기
              </button>
            ) : (
              <div className="analyze-panel full-width">
                <div className="analyze-header">
                  {/* 헤더에 필요한 요소가 있다면 추가 */}
                </div>
                <div className="camera-feed-area">
                  <video ref={videoRef} autoPlay playsInline muted />
                  {resultText && <p className="camera-message">{resultText}</p>}
                  {/* 여기에 '촬영 종료' 또는 '분석 시작' 버튼 등을 추가할 수 있습니다. */}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyMissionVideo;