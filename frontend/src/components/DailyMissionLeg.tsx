// src/components/DailyMissionLeg.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/DailyMissionVideo.css";
import axios from "axios";
import flameIcon from "../assets/flame.png";

axios.defaults.baseURL = "https://web-production-6e732.up.railway.app";

const DailyMissionLeg: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [showCameraFeed, setShowCameraFeed] = useState(false);
  const [resultText, setResultText] = useState<string>(
    "운동을 시작하려면 실시간 촬영을 시작해주세요."
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const userId = localStorage.getItem("user_id") || "";

  const [currentAngle, setCurrentAngle] = useState<number | null>(null);
  const [currentStatus, setCurrentStatus] = useState<number | null>(null);

  // ✅ 레그레이즈 전용 카운트
  const getInitialCountFromLocalStorage = useCallback(() => {
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      return 0;
    }
    const storedCount = localStorage.getItem(
      `dailyMissionCount_${userId}_leg_raise`
    );
    const parsedCount = storedCount ? parseInt(storedCount, 10) : 0;
    return isNaN(parsedCount) ? 0 : parsedCount;
  }, [userId]);

  const [currentCount, setCurrentCount] = useState<number>(
    getInitialCountFromLocalStorage()
  );

  useEffect(() => {
    if (userId && typeof userId === "string" && userId.trim() !== "") {
      localStorage.setItem(
        `dailyMissionCount_${userId}_leg_raise`,
        currentCount.toString()
      );
    }
  }, [currentCount, userId]);

  const captureIntervalId = useRef<number | null>(null);
  const isAnalyzing = useRef(false);

  const [dailyMissionDisplayData, setDailyMissionDisplayData] = useState<{
    missionName: string;
    currentCount: number;
    targetCount: number;
  } | null>(null);

  useEffect(() => {
    if (
      location.state &&
      typeof location.state === "object" &&
      "missionName" in location.state
    ) {
      const {
        missionName,
        currentCount: initialCount,
        targetCount,
      } = location.state as {
        missionName: string;
        currentCount: number;
        targetCount: number;
      };
      setDailyMissionDisplayData({
        missionName,
        currentCount: initialCount,
        targetCount,
      });
      setCurrentCount(initialCount);
    } else {
      setDailyMissionDisplayData(null);
      console.warn(
        "location.state에 데일리 미션 데이터가 없습니다. 데일리 미션 박스를 숨깁니다."
      );
    }
  }, [userId, location.state]);

  const captureFrameAndSend = useCallback(async () => {
    if (videoRef.current && canvasRef.current && !isAnalyzing.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        context.setTransform(1, 0, 0, 1, 0, 0);

        const imageData = canvas.toDataURL("image/jpeg", 0.7);

        isAnalyzing.current = true;
        try {
          // ✅ 레그레이즈 분석 엔드포인트
          const response = await axios.post("/api/analyze_frame/leg_raise", {
            image: imageData,
            user_id: userId,
          });

          const { angle, status, count } = response.data;

          if (typeof angle === "number" && !isNaN(angle)) {
            setCurrentAngle(angle);
          }
          if (typeof status === "number" && (status === 0 || status === 1)) {
            setCurrentStatus(status);
          }

          if (typeof count === "number" && !isNaN(count)) {
            setCurrentCount(count);
          }

          setResultText(
            "다리를 수직에 가깝게 올리고 바닥에 닿기 직전까지 내리면 횟수가 올라갑니다."
          );
        } catch (error) {
          console.error("프레임 분석 오류:", error);
          setResultText(
            "운동 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
          );
        } finally {
          isAnalyzing.current = false;
        }
      }
    }
  }, [userId]);

  const startLiveCamera = async () => {
    setShowCameraFeed(true);
    setResultText("카메라 스트림 시작 중...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        if (captureIntervalId.current) clearInterval(captureIntervalId.current);
        captureIntervalId.current = window.setInterval(captureFrameAndSend, 50);
        setResultText(
          "다리를 수직에 가깝게 올리고 바닥에 닿기 직전까지 내리면 횟수가 올라갑니다."
        );
      }
    } catch (err) {
      console.error("카메라 접근 오류: ", err);
      setResultText("카메라에 접근할 수 없습니다. 권한을 확인해주세요.");
    }
  };

  const stopLiveCamera = () => {
    setShowCameraFeed(false);
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());
    }
    if (captureIntervalId.current) {
      clearInterval(captureIntervalId.current);
      captureIntervalId.current = null;
    }
    isAnalyzing.current = false;
    setResultText("촬영이 종료되었습니다.");
    setCurrentAngle(null);
    setCurrentStatus(null);
  };

  const handleGoHome = () => {
    stopLiveCamera();
    navigate("/");
  };

  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, []);

  return (
    <div className="page-center-container">
      <div className="video-analyze-container">
        {dailyMissionDisplayData && (
          <div className="daily-mission-cont">
            <img src={flameIcon} alt="불꽃 아이콘" className="flame-icon" />
            <div className="daily-mission-right-content">
              <div className="mission-title">데일리미션</div>
              <div className="exercise-progress">
                {dailyMissionDisplayData.missionName} {currentCount}/
                {dailyMissionDisplayData.targetCount}
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
                  <h3>운동 분석</h3>
                  <div className="button-group">
                    <button
                      className="stop-camera-button"
                      onClick={stopLiveCamera}
                    >
                      촬영 종료
                    </button>
                    <button className="go-home-button" onClick={handleGoHome}>
                      홈으로 돌아가기
                    </button>
                  </div>
                </div>
                <div className="camera-feed-area">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="camera-video"
                    style={{ transform: "scaleX(-1)" }}
                  />
                  <canvas ref={canvasRef} style={{ display: "none" }} />
                  {resultText && <p className="camera-message">{resultText}</p>}

                  <div className="analysis-results">
                    <p>
                      현재 각도:{" "}
                      {currentAngle !== null && typeof currentAngle === "number"
                        ? `${currentAngle.toFixed(2)}°`
                        : "측정 대기 중..."}
                    </p>
                    <p>
                      자세 상태:{" "}
                      {currentStatus === 1
                        ? "몸 굽힘"
                        : currentStatus === 0
                        ? "몸 폄"
                        : "측정 대기 중..."}
                    </p>
                    <p>운동 횟수: {currentCount}회</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyMissionLeg;
