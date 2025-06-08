// src/components/DailyMissionVideo.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import "../styles/DailyMissionVideo.css";
import axios from "axios";
import flameIcon from '../assets/flame.png';


axios.defaults.baseURL = "http://127.0.0.1:5000"; 

const DailyMissionVideo: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const id = Number(videoId);

  const location = useLocation();

  const [showCameraFeed, setShowCameraFeed] = useState(false);
  const [resultText, setResultText] = useState<string>("준비 중...");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const userId = localStorage.getItem("user_id") || "";

  const [currentAngle, setCurrentAngle] = useState<number | null>(null);
  const [currentStatus, setCurrentStatus] = useState<number | null>(null);

  // **** LOCAL STORAGE 관련 코드 (이전과 동일, userId 유효성 검사 포함) ****
  const getInitialCountFromLocalStorage = useCallback(() => {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return 0;
    }
    const storedCount = localStorage.getItem(`dailyMissionCount_${userId}`);
    const parsedCount = storedCount ? parseInt(storedCount, 10) : 0;
    return isNaN(parsedCount) ? 0 : parsedCount;
  }, [userId]);

  const [currentCount, setCurrentCount] = useState<number>(getInitialCountFromLocalStorage());

  useEffect(() => {
    if (userId && typeof userId === 'string' && userId.trim() !== '') {
      localStorage.setItem(`dailyMissionCount_${userId}`, currentCount.toString());
    }
  }, [currentCount, userId]);
  // **** LOCAL STORAGE 관련 코드 끝 ****

  const captureIntervalId = useRef<number | null>(null);
  const isAnalyzing = useRef(false);

  const [dailyMissionDisplayData, setDailyMissionDisplayData] = useState<{
    missionName: string;
    currentCount: number;
    targetCount: number;
  } | null>(null);

  useEffect(() => {
    if (location.state && typeof location.state === 'object' && 'missionName' in location.state) {
      const { missionName, currentCount: initialCount, targetCount } = location.state as {
        missionName: string;
        currentCount: number;
        targetCount: number;
      };
      setDailyMissionDisplayData({ missionName, currentCount: initialCount, targetCount });
      setCurrentCount(initialCount); 
    } else {
      setDailyMissionDisplayData(null);
      console.warn("location.state에 데일리 미션 데이터가 없습니다. 데일리 미션 박스를 숨깁니다.");
    }
  }, [id, userId, location.state]);

  const captureFrameAndSend = useCallback(async () => {
    if (videoRef.current && canvasRef.current && !isAnalyzing.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = canvas.toDataURL("image/jpeg", 0.7);

        isAnalyzing.current = true;
        try {
          const response = await axios.post("/api/analyze_frame", {
            image: imageData,
            user_id: userId,
          });

          const { angle, status, count } = response.data;
          setCurrentAngle(angle);
          setCurrentStatus(status);
          
          // **** 여기만 수정됨: count가 유효한 숫자일 때만 업데이트 ****
          if (typeof count === 'number' && !isNaN(count)) {
              setCurrentCount(count); 
          }
          // ******************************************************

          if (angle === null || typeof angle !== 'number') { 
            setResultText("포즈 인식 실패. 다시 시도해주세요. (각도 정보 없음)");
          } else {
            setResultText(`각도: ${angle.toFixed(2)}°, 상태: ${status === 1 ? '몸 굽힘' : '몸 폄'}, 횟수: ${count}회`); 
          }
        } catch (error) {
          console.error("프레임 분석 오류:", error);
          if (axios.isAxiosError(error) && error.response) {
            setResultText(`분석 오류: ${error.response.data.error || error.message}`);
          } else {
            setResultText(`분석 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`);
          }
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
        captureIntervalId.current = window.setInterval(captureFrameAndSend, 100); 
        setResultText("실시간 촬영 및 분석 중...");
      }
    } catch (err) {
      console.error("카메라 접근 오류: ", err);
      setResultText("카메라에 접근할 수 없습니다. 권한을 확인해주세요.");
    }
  };

  const stopLiveCamera = () => {
    setShowCameraFeed(false);
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
    if (captureIntervalId.current) {
      clearInterval(captureIntervalId.current);
      captureIntervalId.current = null;
    }
    isAnalyzing.current = false; 
    setResultText("촬영이 종료되었습니다.");
    // 필요하다면 여기에서 카운트/각도/상태를 초기화할 수 있습니다.
    // setCurrentAngle(null);
    // setCurrentStatus(null);
    // setCurrentCount(0); // 만약 종료 시 횟수를 0으로 초기화하고 싶다면 주석 해제
    // localStorage.removeItem(`dailyMissionCount_${userId}`); // localStorage에서도 삭제 (필요하다면)
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
                {dailyMissionDisplayData.missionName} {currentCount}/{dailyMissionDisplayData.targetCount}
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
                  <button className="stop-camera-button" onClick={stopLiveCamera}>
                    촬영 종료
                  </button>
                </div>
                <div className="camera-feed-area">
                  <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
                  {/* 프레임 캡처를 위해 숨겨진 캔버스 */}
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  {resultText && <p className="camera-message">{resultText}</p>}
                  
                  {/* 실시간 각도, 상태, 횟수 표시 */}
                  <div className="analysis-results">
                    <p>현재 각도: {currentAngle !== null && typeof currentAngle === 'number' ? `${currentAngle.toFixed(2)}°` : '측정 중...'}</p>
                    <p>자세 상태: {currentStatus === 1 ? '몸 굽힘' : (currentStatus === 0 ? '몸 폄' : '측정 중...')}</p>
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

export default DailyMissionVideo;