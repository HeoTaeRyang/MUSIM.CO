import React, { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import VideoDetail from "./VideoDetail";
import "../styles/VideoAnalyze.css";
import { FaTimes, FaDownload, FaShareAlt } from "react-icons/fa";
import axios from "axios";
import classNames from "classnames";

const VideoAnalyze: React.FC = () => {
  const location = useLocation();

  // VideoDetail에서 state로 넘긴 영상 객체를 받음
  const video = location.state?.video || {
    id: "sample",
    title: "샘플 영상",
    video: "/assets/sample_video.mp4",
  };

  const [showPanel, setShowPanel] = useState(true);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const userId = localStorage.getItem("user") || "";

  // 분석 버튼(필요하다면 구현, 아니면 생략 가능)
  const handleAnalyzeClick = () => {
    // ...분석 API 요청 등 구현
  };

  // 분석 패널 닫기
  const handleClose = () => {
    setShowPanel(false);
    setUploadedUrl(null);
    setResultText("");
    if (inputRef.current) inputRef.current.value = "";
  };

  // 파일 업로드 및 분석 요청
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setUploadedUrl(preview);

    // --- 실제 분석 요청 ---
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);

    try {
      // 예시: 백엔드 API 주소/파라미터는 너 프로젝트에 맞게 고칠 것!
      const res = await axios.post(
        `/video/${video.id}/posture/analyze`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      const data = res.data || {};
      setResultText(data.result_text || ""); // 성공 시 결과 표시
      // setUploadedUrl(data.image_url || preview); // 만약 서버에서 분석이미지 주면 이것도!
    } catch (error) {
      setResultText("분석 실패!");
    }
  };

  return (
    <div className="video-analyze-container">
      <div className={classNames("video-area", { "with-panel": showPanel })}>
        <VideoDetail
          videoId={video.id}
          hideComments={true}
          videoSrc={video.video} // ★ VideoDetail의 영상만 받아서 재생!
          onAnalyzeClick={handleAnalyzeClick}
        />
      </div>
      {showPanel && (
        <div className="analyze-panel">
          <div className="analyze-header">
            <h2>영상 업로드</h2>
            <button className="close-btn" onClick={handleClose}>
              <FaTimes />
            </button>
          </div>
          <div className="upload-area">
            {!uploadedUrl ? (
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
              <video className="uploaded-video" src={uploadedUrl} controls />
            )}
          </div>
          {resultText && (
            <div className="analysis-result">
              <h3>결과</h3>
              <p>{resultText}</p>
              <div className="result-buttons">
                <button className="btn save-btn">
                  <FaDownload /> 저장하기
                </button>
                <button className="btn share-btn">
                  <FaShareAlt /> 공유하기
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoAnalyze;
