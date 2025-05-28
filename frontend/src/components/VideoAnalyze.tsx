// src/components/VideoAnalyze.tsx
import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import VideoDetail from "./VideoDetail";
import "../styles/VideoAnalyze.css";
import { FaTimes, FaDownload, FaShareAlt } from "react-icons/fa";
import axios from "axios";
import classNames from "classnames";

axios.defaults.baseURL = "/"; // Vite proxy 설정이 되어 있다면

const VideoAnalyze: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const id = Number(videoId);

  const [showPanel, setShowPanel] = useState(true);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const userId = localStorage.getItem("user_id") || "";

  // 1) 이전에 저장된 결과 조회
  useEffect(() => {
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
  }, [id, userId]);

  const handleClose = () => {
    setShowPanel(false);
    setUploadedUrl(null);
    setResultText("");
    if (inputRef.current) inputRef.current.value = "";
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
      <div className="panels">
        <div className={classNames("video-area", { "with-panel": showPanel })}>
          <VideoDetail
            videoId={String(id)}
            hideComments
            videoSrc={uploadedUrl || ""}
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

      {resultText && (
        <div className="analysis-result-below">
          <h3>결과</h3>
          <p style={{ whiteSpace: "pre-line" }}>{resultText}</p>
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
