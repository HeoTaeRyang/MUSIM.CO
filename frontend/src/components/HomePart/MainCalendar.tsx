import React, { useState } from "react";
import "../../styles/MainCalendar.css";

const days = ["일", "월", "화", "수", "목", "금", "토"];

const MainCalendar: React.FC = () => {
  const [attendedDates, setAttendedDates] = useState<number[]>([]);

  const today = new Date();
  const year = today.getFullYear();
  const month = 4; // 5월 (0부터 시작)
  const todayDate = today.getDate();

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  const dates = Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: lastDate }, (_, i) => i + 1)
  );

  const handleAttend = () => {
    if (!attendedDates.includes(todayDate)) {
      setAttendedDates([...attendedDates, todayDate]);
    }
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">5월 출석현황</div>
      <div className="calendar-grid">
        {days.map((day) => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}
        {dates.map((date, index) => {
          const isToday = date === todayDate;
          const isAttended = attendedDates.includes(date || -1);

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
        disabled={attendedDates.includes(todayDate)}
      >
        {attendedDates.includes(todayDate) ? "출석 완료" : "출석하기"}
      </button>
    </div>
  );
};

export default MainCalendar;
