import React, { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import VideoDetail from "./VideoDetail";
import "../styles/VideoAnalyze.css";
import { FaTimes, FaDownload, FaShareAlt } from "react-icons/fa";
import axios from "axios";
import classNames from "classnames";

const VideoAnalyze: React.FC = () => {
  const location = useLocation();
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

  const handleClose = () => {
    setShowPanel(false);
    setUploadedUrl(null);
    setResultText("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setUploadedUrl(preview);

    const formData = new FormData();
    formData.append("video_file", file);
    formData.append("user_id", userId);

    try {
      // 업로드
      const up = await axios.post(
        `/video/${video.id}/posture/upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const video_path = up.data.path;

      // 분석
      const ai = await axios.post(
        `/video/${video.id}/posture/analyze`,
        { video_path, user_id: userId }
      );
      setResultText(ai.data.result_text || "");
    } catch {
      setResultText("분석 실패!");
    }
  };

  // 저장하기 → 서버에 POST
  const handleSave = async () => {
    if (!uploadedUrl || !resultText) {
      alert("저장할 데이터가 없습니다.");
      return;
    }
    try {
      await axios.post(
        `/video/${video.id}/posture/save`,
        {
          user_id: userId,
          result_text: resultText,
          image_url: uploadedUrl
        }
      );
      alert("분석 결과가 저장되었습니다.");
    } catch (err) {
      console.error(err);
      alert("저장에 실패했습니다.");
    }
  };

  // 공유하기 클릭 → 링크 복사
  const handleShare = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl)
      .then(() => alert("링크가 복사되었습니다!"))
      .catch(() => alert("링크 복사에 실패했습니다."));
  };

  return (
    <div className="video-analyze-container">
      {/* ── 두 패널 묶음 ────────────────────────────────────────────── */}
      <div className="panels">
        <div className={classNames("video-area", { "with-panel": showPanel })}>
          <VideoDetail
            videoId={video.id}
            hideComments={true}
            videoSrc={video.video}
            onAnalyzeClick={() => setShowPanel(true)}
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
                <video
                  className="uploaded-video"
                  src={uploadedUrl}
                  controls
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── 분석 결과: 두 패널 하단에 중앙 정렬 ──────────────────────────── */}
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
