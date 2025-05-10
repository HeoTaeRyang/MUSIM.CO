import { useState, useRef } from 'react';
import VideoDetail from './VideoDetail';  // 영상 상세페이지에서 영상+컨트롤바 불러오기
import axios from 'axios';
import { FaTimes, FaDownload, FaShareAlt } from 'react-icons/fa';
import '../styles/VideoAnalyze.css';

interface Props {
    videoId: string;
}

const VideoAnalyze: React.FC<Props> = ({ videoId }) => {
    const [showPanel, setShowPanel] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
    const [resultText, setResultText] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);

    // localStorage 에 로그인 시 저장해둔 user id
    const userId = localStorage.getItem('user') || '';

    const handleAnalyzeClick = () => {
        setShowPanel(true);
        // 패널 열 때, 서버에서 바로 최신 결과만 가져와서 resultText, uploadedUrl에 세팅
        axios.get(`/video/${videoId}/posture/result`, { params: { user_id: userId } })
            .then(res => {
                const data = res.data || {};
                setResultText(data.result_text || '');
                setUploadedUrl(data.image_url || null);
            })
            .catch(() => { });
    };

    const handleClose = () => {
        setShowPanel(false);
        setUploadedUrl(null);
        setResultText('');
        if (inputRef.current) inputRef.current.value = '';
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1) 미리보기
        const preview = URL.createObjectURL(file);
        setUploadedUrl(preview);

        // 2) 업로드 (multipart/form-data)
        const form = new FormData();
        form.append('video_file', file);
        form.append('user_id', userId);
        const up = await axios.post(
            `/video/${videoId}/posture/upload`,
            form,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        const video_path = up.data.path;

        // 3) 분석 요청
        const ai = await axios.post(
            `/video/${videoId}/posture/analyze`,
            { video_path, user_id: userId }
        );
        setResultText(ai.data.result_text);

        // 4) 분석 결과 저장
        await axios.post(
            `/video/${videoId}/posture/save`,
            { user_id: userId, result_text: ai.data.result_text, image_url: preview }
        );

    };

    return (
        <div className="video-analyze-container">
            <div className={`video-area ${showPanel ? 'with-panel' : ''}`}>
                <VideoDetail onAnalyzeClick={handleAnalyzeClick} />
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
