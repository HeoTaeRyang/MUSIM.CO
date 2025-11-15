import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/DailyMissionSelect.css";

const DailyMissionSelect: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="select-mission-container">
            <h1 className="select-mission-title">데일리 미션</h1>
            <p className="select-mission-subtitle">두 가지 미션 중 하나를 선택하세요!</p>

            <div className="select-mission-button-group">
                <button
                    className="select-mission-button select-situp-button"
                    onClick={() => navigate("/daily-mission/video")}
                >
                    윗몸 일으키기
                </button>

                <button
                    className="select-mission-button select-legraise-button"
                    onClick={() => navigate("/daily-mission/leg")}
                >
                    레그 레이즈
                </button>
            </div>
        </div>
    );
};

export default DailyMissionSelect;
