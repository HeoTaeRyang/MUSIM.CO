import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/MainCalendar.css";

const days = ["일", "월", "화", "수", "목", "금", "토"];

interface Props {
  userId: string;
}

interface CalendarCellProps {
  date: number | null;
  isToday: boolean;
  isAttended: boolean;
}

const CalendarCell = React.memo(
  ({ date, isToday, isAttended }: CalendarCellProps) => {
    const className =
      date == null
        ? "inactive"
        : isAttended
        ? "attended"
        : isToday
        ? "today"
        : "active";

    return <div className={`calendar-cell ${className}`}>{date}</div>;
  }
);

const MainCalendar: React.FC<Props> = ({ userId }) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-based
  const todayDate = today.getDate();

  const [hasAttended, setHasAttended] = useState(false);
  const [attendedDates, setAttendedDates] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();

  const emptyDates: (number | null)[] = Array.from(
    { length: firstDay },
    () => null
  );
  const filledDates: (number | null)[] = Array.from(
    { length: lastDate },
    (_, i) => i + 1
  );
  const dates: (number | null)[] = [...emptyDates, ...filledDates];

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await axios.post("/attendance/month", { id: userId });
        const recordDates: string[] = res.data.records;
        const dateNums = recordDates.map((d) => parseInt(d.split("-")[2], 10));
        setAttendedDates(dateNums);
        if (dateNums.includes(todayDate)) {
          setHasAttended(true);
        }
      } catch (err) {
        console.error("출석 기록 불러오기 실패", err);
      }
    };

    fetchAttendance();
  }, [userId, todayDate]);

  const handleAttend = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/attendance", { id: userId });
      console.log("✅ 응답 성공:", res.data);
      setStatusMessage(res.data.message);
      setHasAttended(true);
      setAttendedDates((prev) => [...prev, todayDate]);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error("❌ 응답 에러:", err.response?.data);
        if (err.response?.status === 400) {
          setStatusMessage(err.response.data.message);
          setHasAttended(true);
        } else {
          setStatusMessage("출석 처리에 실패했습니다.");
        }
      } else {
        console.error("❌ 예기치 못한 에러:", err);
        setStatusMessage("알 수 없는 오류가 발생했습니다.");
      }
    }
  };

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
          const isAttended = date != null && attendedDates.includes(date);

          return (
            <CalendarCell
              key={index}
              date={date}
              isToday={isToday}
              isAttended={isAttended}
            />
          );
        })}
      </div>

      <button
        className="attendance-button"
        onClick={handleAttend}
        disabled={hasAttended || loading}
      >
        {loading ? "처리 중..." : hasAttended ? "출석 완료" : "출석하기"}
      </button>

      {statusMessage && <div className="status-message">{statusMessage}</div>}
    </div>
  );
};

export default MainCalendar;
