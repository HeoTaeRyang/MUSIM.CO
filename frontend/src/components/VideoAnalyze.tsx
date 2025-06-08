import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import VideoDetail from "./VideoDetail";
import "../styles/VideoAnalyze.css";
import { FaSpinner, FaDownload, FaShareAlt } from "react-icons/fa";
import { MdOutlineFileUpload, MdPhotoCamera } from "react-icons/md";
import axios from "axios";
import classNames from "classnames";

axios.defaults.baseURL = "/";

const VideoAnalyze: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const id = Number(videoId);
  const userId = localStorage.getItem("user_id") || "";

  const [showPanel, setShowPanel] = useState(true);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const webcamPreviewRef = useRef<HTMLVideoElement>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);

  useEffect(() => {
    if (!userId || !id) return;
    axios.get(`/video/${id}/posture/result`, { params: { user_id: userId } })
      .then((res) => {
        if (res.data) {
          setUploadedUrl(res.data.result_video_url || res.data.image_url);
          setResultText(res.data.result_text || "정확한 평가를 위해 가이드 영상처럼 따라 해보세요!");
          setShowPanel(false);
        }
      }).catch(() => { });
  }, [id, userId]);

  const handleReset = () => {
    setUploadedUrl(null);
    setResultText("");
    setRecordedBlob(null);
    setThumbnails([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId || !id) return;

    const preview = URL.createObjectURL(file);
    setUploadedUrl(preview);
    setResultText("분석 중입니다...");

    const formData = new FormData();
    formData.append("video_file", file);
    formData.append("user_id", userId);

    try {
      const up = await axios.post(`/video/${id}/posture/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const resultText = up.data.result_text || "정확한 평가를 위해 가이드 영상처럼 따라 해보세요!";
      const resultVideoUrl = up.data.result_video_url;

      if (resultVideoUrl) {
        setUploadedUrl(resultVideoUrl);
      }

      setResultText(resultText);
    } catch (err: any) {
      console.error(err);
      setResultText(err.response?.data?.error || "분석 실패!");
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        setRecordedBlob(blob);
        setUploadedUrl(URL.createObjectURL(blob));
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
      };

      setMediaRecorder(recorder);
      setIsRecording(true);

      setTimeout(() => {
        if (webcamPreviewRef.current) {
          webcamPreviewRef.current.srcObject = stream;
          webcamPreviewRef.current.play().catch((err) => {
            console.error("비디오 재생 실패:", err);
          });
        }
      }, 100);

      recorder.start();
    } catch (error) {
      console.error("카메라 접근 실패:", error);
      alert("카메라 접근을 허용해주세요.");
    }
  };

  const handleStopRecording = () => {
    mediaRecorder?.stop();
  };

  const handleUploadRecorded = async () => {
    if (!recordedBlob || !userId || !id) return;
    setResultText("분석 중입니다...");

    const formData = new FormData();
    formData.append("video_file", recordedBlob, "recorded_video.webm");
    formData.append("user_id", userId);

    try {
      const up = await axios.post(`/video/${id}/posture/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const resultText = up.data.result_text || "정확한 평가를 위해 가이드 영상처럼 따라 해보세요!";
      const resultVideoUrl = up.data.result_video_url;

      if (resultVideoUrl) {
        setUploadedUrl(resultVideoUrl);
        setRecordedBlob(null);
      }

      setResultText(resultText);
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
          <VideoDetail videoId={videoId} hideComments={true} onAnalyzeClick={() => setShowPanel(true)} />
        </div>

        {showPanel && (
          <div className="video-analyze-panel">
            <p className="instruction-text">⚠️운동하는 부분만 업로드해야 합니다⚠️</p>
            <div className="upload-area">
              {!uploadedUrl && !isRecording ? (
                <div className="upload-buttons-container">
                  <div className="upload-button" onClick={() => inputRef.current?.click()}>
                    <MdOutlineFileUpload className="upload-icon-react" />
                    <p>영상 업로드</p>
                    <input type="file" accept="video/*" ref={inputRef} onChange={handleFileChange} hidden />
                  </div>
                  <div className="upload-button" onClick={handleStartRecording}>
                    <MdPhotoCamera className="upload-icon-react" />
                    <p>영상 촬영</p>
                  </div>
                </div>
              ) : isRecording ? (
                <div className="recording-preview">
                  <p>녹화 중...</p>
                  <video ref={webcamPreviewRef} autoPlay muted playsInline className="webcam-live-preview" />
                  <button className="btn stop-btn" onClick={handleStopRecording}>녹화 중지</button>
                </div>
              ) : (
                <div className="preview-wrapper">
                  <video ref={videoRef} src={uploadedUrl || undefined} className="uploaded-video" controls preload="metadata" />
                  <div className="thumbnail-strip">
                    {thumbnails.map((thumb, idx) => (
                      <img key={idx} src={thumb} alt={`thumb-${idx}`} className="thumbnail-image" />
                    ))}
                  </div>
                  <div className="result-buttons">
                    <button className="btn save-btn" onClick={handleUploadRecorded}>영상 업로드하기</button>
                    <button className="btn reset-btn" onClick={handleReset}>다시 촬영하기</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {resultText && (
        resultText === "분석 중입니다..." ? (
          <div className="loading-container">
            <FaSpinner className="spinner-icon" />
            <p>분석 중입니다...</p>
          </div>
        ) : (
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
        )
      )}
    </div>
  );
};

export default VideoAnalyze;
