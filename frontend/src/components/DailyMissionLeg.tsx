
import React from "react";
import "../styles/DailyMissionVideo.css"; // 임시로 동일한 스타일 사용

const DailyMissionLeg: React.FC = () => {
    return (
        <div className="page-center-container">
            <div className="video-analyze-container">
                <div className="daily-mission-cont">
                    <div className="daily-mission-right-content">
                        <div className="mission-title">데일리미션</div>
                        <div className="exercise-progress">레그레이즈 (임시 페이지)</div>
                    </div>
                </div>

                <div className="panels">
                    <div className="camera-control-area">
                        <div className="analyze-panel full-width">
                            <div className="analyze-header">
                                <h3>레그레이즈 분석 페이지 (준비 중)</h3>
                            </div>
                            <div className="camera-feed-area">
                                <p className="camera-message">
                                    이 페이지는 현재 개발 중입니다. 곧 레그레이즈 분석 기능이 추가될 예정입니다.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyMissionLeg;
