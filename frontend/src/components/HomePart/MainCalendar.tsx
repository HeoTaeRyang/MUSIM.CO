import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/MainCalendar.css";

const API_BASE_URL = "http://127.0.0.1:5000";
const days = ["일", "월", "화", "수", "목", "금", "토"];

interface Props {
  userId: string;
}

const MainCalendar: React.FC<Props> = ({ userId }) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-based
  const todayDate = today.getDate();

  const [hasAttended, setHasAttended] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();

  const dates = Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: lastDate }, (_, i) => i + 1)
  );

  const handleAttend = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/attendance`, {
        id: userId, // ✅ 백엔드 형식에 맞춤
      });
      setStatusMessage(res.data.message);
      setHasAttended(true);
    } catch (err: any) {
      if (err.response && err.response.status === 400) {
        setStatusMessage(err.response.data.message);
        setHasAttended(true);
      } else {
        setStatusMessage("출석 처리에 실패했습니다.");
      }
    }
  };

  // 컴포넌트 로드시 바로 출석 시도 → 상태 판단용
  useEffect(() => {
    handleAttend();
  }, []);

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        {currentYear}년 {currentMonth + 1}월 출석현황
      </div>

      <div className="calendar-grid">
        {days.map((day) => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}

        {dates.map((date, index) => {
          const isToday = date === todayDate;
          const isAttended = isToday && hasAttended;

          return (
            <div
              key={index}
              className={`calendar-cell ${
                date == null
                  ? "inactive"
                  : isAttended
                  ? "attended"
                  : isToday
                  ? "today"
                  : "active"
              }`}
            >
              {date}
            </div>
          );
        })}
      </div>

      <button
        className="attendance-button"
        onClick={handleAttend}
        disabled={hasAttended}
      >
        {hasAttended ? "출석 완료" : "출석하기"}
      </button>

      {statusMessage && <div className="status-message">{statusMessage}</div>}
    </div>
  );
};

export default MainCalendar;
