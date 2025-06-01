// src/components/VideoAnalyze.tsx
import React, { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom"; // <-- useLocation 추가
import VideoDetail from "./VideoDetail";
import "../styles/VideoAnalyze.css";
import { FaDownload, FaShareAlt } from "react-icons/fa";
import axios from "axios";
import classNames from "classnames";

// DailyMission 컴포넌트의 스타일과 이미지를 재사용하기 위해 추가
import flameIcon from '../assets/flame.png'; // <--- 불꽃 아이콘 이미지 경로 확인 및 추가
import '../styles/DailyMission.css'; // <--- DailyMission의 CSS 파일 import (스타일 재사용)

axios.defaults.baseURL = "/"; // Vite proxy 설정이 되어 있다면

const VideoAnalyze: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const id = Number(videoId);

  const location = useLocation(); // <--- location 객체 가져오기 (state 포함)

  const [showPanel, setShowPanel] = useState(true);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const userId = localStorage.getItem("user_id") || "";

  // 데일리 미션 정보를 저장할 상태 추가
  // 초기값을 null로 설정하여 미션 정보가 없을 때는 아무것도 표시하지 않도록 합니다.
  const [dailyMissionDisplayData, setDailyMissionDisplayData] = useState<{
    missionName: string;
    currentCount: number;
    targetCount: number;
  } | null>(null);

  // 1) 이전에 저장된 결과 조회 및 데일리 미션 정보 로드 (추가된 로직)
  useEffect(() => {
    // URL state에서 미션 정보를 가져옴
    // location.state에 missionName 속성이 있는지 확인하여 '시작하기' 버튼을 통해 진입했는지 판단합니다.
    if (location.state && typeof location.state === 'object' && 'missionName' in location.state) {
      const { missionName, currentCount, targetCount } = location.state as {
        missionName: string;
        currentCount: number;
        targetCount: number;
      };
      setDailyMissionDisplayData({ missionName, currentCount, targetCount });
    } else {
      // '시작하기' 버튼을 통해 진입하지 않았거나, 새로고침 등으로 state가 사라진 경우
      setDailyMissionDisplayData(null); // 미션 정보 상태를 null로 설정하여 박스가 렌더링되지 않도록 합니다.
      console.warn("Daily mission data not found in location state. Hiding daily mission box.");
    }

    // 기존의 결과 조회 로직
    if (!userId || !id) return;
    axios
      .get(`/video/${id}/posture/result`, { params: { user_id: userId } })
      .then((res) => {
        if (res.data) {
          setUploadedUrl(res.data.image_url);
          setResultText(res.data.result_text);
          setShowPanel(false);
        }
      })
      .catch(() => {
        /* 아직 결과 없음 */
      });
  }, [id, userId, location.state]); // location.state를 의존성 배열에 추가

  // “다시 업로드하기” 버튼을 눌렀을 때 동작: 업로드한 비디오와 결과를 모두 초기화
  const handleReset = () => {
    // 비디오 preview, 분석 결과 둘 다 삭제
    setUploadedUrl(null);
    setResultText("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId || !id) return;

    // 미리보기
    const preview = URL.createObjectURL(file);
    setUploadedUrl(preview);
    setResultText("분석 중입니다...");

    // 2) 업로드
    const formData = new FormData();
    formData.append("video_file", file);
    formData.append("user_id", userId);

    try {
      const up = await axios.post(
        `/video/${id}/posture/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const video_path = up.data.path;

      // 3) 분석
      const ai = await axios.post(
        `/video/${id}/posture/analyze`,
        { video_path, user_id: userId }
      );
      setResultText(ai.data.result_text || "문제 없음");
    } catch (err: any) {
      console.error(err);
      setResultText(err.response?.data?.error || "분석 실패!");
    }
  };

  const handleSave = async () => {
    if (!uploadedUrl || !resultText || !userId || !id) {
      alert("저장할 데이터가 없습니다.");
      return;
    }
    try {
      await axios.post(`/video/${id}/posture/save`, {
        user_id: userId,
        result_text: resultText,
        image_url: uploadedUrl,
      });
      alert("분석 결과가 저장되었습니다.");
      setShowPanel(false);
    } catch (err) {
      console.error(err);
      alert("저장에 실패했습니다.");
    }
  };

  const handleShare = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => alert("링크가 복사되었습니다!"))
      .catch(() => alert("링크 복사에 실패했습니다."));
  };

  return (
    <div className="video-analyze-container">
      {/* 상단 데일리미션 박스 (dailyMissionDisplayData가 null이 아닐 때만 렌더링) */}
      {dailyMissionDisplayData && ( // <--- 이 조건부 렌더링 추가
        <div className="daily-mission-card top-card video-analyze-mission-display"> {/* video-analyze-mission-display 클래스 추가, 필요 시 VideoAnalyze.css에서 이 클래스로 추가 스타일링 */}
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
        {/* ─────────────── 두 패널 묶음 ────────────────── */}
        <div className={classNames("video-area", { "with-panel": showPanel })}>
          <VideoDetail
            videoId={videoId}
            hideComments={true}
            onAnalyzeClick={() => setShowPanel(true)}
          />
        </div>

        {showPanel && (
          <div className="analyze-panel">


            {/* ─── 업로드 영역 ─────────────────────────────── */}
            <div className="upload-area">
              {!uploadedUrl ? (
                // 아직 비디오를 선택하지 않은 상태: 파일 선택 UI
                <label className="upload-label">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    ref={inputRef}
                  />
                  <div className="upload-icon">📁</div>
                  <p>분석할 영상을 업로드하세요</p>
                </label>
              ) : (
                // 비디오 업로드가 끝난 상태: 미리보기 비디오 + “다시 업로드하기” 버튼
                <div className="preview-wrapper">
                  <video className="uploaded-video" src={uploadedUrl} controls />
                  <button className="reset-btn" onClick={handleReset}>
                    다시 업로드하기
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* ──────────── 분석 결과: 두 패널 하단에 중앙 정렬 ──────────── */}
      {resultText && (
        <div className="analysis-result-below">
          <h3>결과</h3>
          <p>{resultText}</p>
          <div className="result-buttons">
            <button className="btn save-btn" onClick={handleSave}>
              <FaDownload /> 저장하기
            </button>
            <button className="btn share-btn" onClick={handleShare}>
              <FaShareAlt /> 공유하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoAnalyze;