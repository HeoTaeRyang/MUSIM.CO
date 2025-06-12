import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import VideoDetail from "./VideoDetail";
import "../styles/VideoAnalyze.css";
import { FaSpinner, FaDownload, FaShareAlt } from "react-icons/fa";
import { MdOutlineFileUpload, MdPhotoCamera } from "react-icons/md";
import axios from "axios";
import classNames from "classnames";

// [배포용 설정] 
// 모든 API 요청이 실제 운영 서버를 향하도록 baseURL을 고정합니다.
axios.defaults.baseURL = "https://web-production-6e732.up.railway.app";


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
  const webcamPreviewRef = useRef<HTMLDivElement>(null);
  const isRecordingRef = useRef(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [previewFrames, setPreviewFrames] = useState<string[]>([]);
  const [analyzedVideoUrl, setAnalyzedVideoUrl] = useState<string | null>(null);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  useEffect(() => {
    if (!userId || !id) return;
    axios.get(`/video/${id}/posture/result`, { params: { user_id: userId } })
      .then((res) => {
        if (res.data && res.data.result_text) {
          setUploadedUrl(res.data.original_video_url || res.data.image_url);
          setResultText(res.data.result_text);
          setPreviewFrames(res.data.preview_frames || []);
          setAnalyzedVideoUrl(res.data.result_video_url);
          setShowPanel(false);
        }
      }).catch(() => { });
  }, [id, userId]);

  useEffect(() => {
    if (previewFrames.length === 0) return;
    const timer = setInterval(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % previewFrames.length);
    }, 1000);
    return () => clearInterval(timer);
  }, [previewFrames]);

  const handleReset = () => {
    setUploadedUrl(null);
    setResultText("");
    setRecordedBlob(null);
    setPreviewFrames([]);
    setAnalyzedVideoUrl(null);
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

      setResultText(up.data.result_text || "분석 결과를 받아오지 못했습니다.");
      setAnalyzedVideoUrl(up.data.result_video_url);
      setPreviewFrames(up.data.preview_frames || []);
      setShowPanel(false);

    } catch (err: any) {
      console.error(err);
      setResultText(err.response?.data?.error || "분석에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      const { width = 640, height = 480 } = settings;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("캔버스 컨텍스트를 가져올 수 없습니다.");

      ctx.scale(-1, 1);
      ctx.translate(-width, 0);

      const videoEl = document.createElement("video");
      videoEl.srcObject = stream;
      videoEl.muted = true;
      videoEl.playsInline = true;

      await videoEl.play();

      setTimeout(() => {
        if (webcamPreviewRef.current) {
          webcamPreviewRef.current.innerHTML = "";
          webcamPreviewRef.current.appendChild(canvas);
        }
      }, 100);

      const drawFrame = () => {
        ctx.drawImage(videoEl, 0, 0, width, height);
        if (isRecordingRef.current) {
          requestAnimationFrame(drawFrame);
        }
      };

      const canvasStream = canvas.captureStream();
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        canvasStream.addTrack(audioTrack);
      }
      
      const recorder = new MediaRecorder(canvasStream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        setRecordedBlob(blob);
        setUploadedUrl(URL.createObjectURL(blob));
        setIsRecording(false);
        isRecordingRef.current = false;
        stream.getTracks().forEach((track) => track.stop());
      };

      if (webcamPreviewRef.current) {
        webcamPreviewRef.current.innerHTML = "";
        webcamPreviewRef.current.appendChild(canvas);
      }

      setMediaRecorder(recorder);
      setIsRecording(true);
      isRecordingRef.current = true;
      recorder.start();
      drawFrame();
    } catch (error) {
      console.error("카메라 접근 실패:", error);
      alert("카메라 접근을 허용해주세요.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    if (webcamPreviewRef.current) {
      webcamPreviewRef.current.innerHTML = "";
    }
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
      setResultText(up.data.result_text || "분석 결과를 받아오지 못했습니다.");
      setAnalyzedVideoUrl(up.data.result_video_url);
      setPreviewFrames(up.data.preview_frames || []);
      setRecordedBlob(null);
      setShowPanel(false);
    } catch (err: any) {
      console.error(err);
      setResultText(err.response?.data?.error || "분석에 실패했습니다. 다시 시도해주세요.");
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
        result_video_url: analyzedVideoUrl,
      });
      alert("분석 결과가 저장되었습니다.");
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
                  <div ref={webcamPreviewRef} className="webcam-live-preview" />
                  <button className="btn stop-btn" onClick={handleStopRecording}>녹화 중지</button>
                </div>
              ) : (
                <div className="preview-wrapper">
                  <video ref={videoRef} src={uploadedUrl || undefined} className="uploaded-video" controls preload="metadata" crossOrigin="anonymous" />
                  
                  {/* 썸네일 표시 로직을 완전히 제거했습니다. */}

                  <div className="result-buttons">
                    {recordedBlob ? (
                      <button className="btn save-btn" onClick={handleUploadRecorded}>녹화 영상으로 분석하기</button>
                    ) : (
                      <></>
                    )}
                    <button className="btn reset-btn" onClick={handleReset}>다시 선택/촬영</button>
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
            <h3>분석 결과</h3>
            <pre className="analysis-result-text">{resultText}</pre>
            
            {previewFrames.length > 0 && (
              <div className="preview-frame-container">
                <h4>분석 프레임</h4>
                <img
                  src={`data:image/jpeg;base64,${previewFrames[currentFrameIndex]}`}
                  alt={`분석 프레임 ${currentFrameIndex + 1}`}
                  className="analyzed-frame-image"
                />
              </div>
            )}

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
