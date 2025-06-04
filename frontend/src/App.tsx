import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, Outlet, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Home from "./components/Home";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Exercise from "./components/exercise";
import VideoDetail from "./components/VideoDetail";
import VideoAnalyze from "./components/VideoAnalyze";
import VideoPurchase from "./components/VideoPurchase";
import MyPage from "./components/mypage";
import Ranking from "./components/HomePart/Ranking";
import DailyMissionVideo from "./components/DailyMissionVideo";

import "./App.css";

function App() {
  // 메시지를 위한 상태
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning' | null>(null);
  const messageDisplayedRef = React.useRef(false); // 메시지 표시 여부를 추적하는 ref
  let messageTimer: NodeJS.Timeout | null = null; // 메시지 자동 숨김을 위한 타이머

  // 메시지를 표시하고 일정 시간 후 사라지게 하는 함수
  const showGlobalMessage = (msg: string, type: 'success' | 'error' | 'warning' = 'error') => {
    // 이미 메시지가 표시 중이면 다시 띄우지 않음 (중복 방지)
    if (globalMessage === msg && messageType === type) {
      return;
    }

    // 이전 타이머가 있다면 클리어 (새로운 메시지가 뜨면 이전 메시지 타이머는 리셋)
    if (messageTimer) {
      clearTimeout(messageTimer);
      messageTimer = null;
    }

    setGlobalMessage(msg);
    setMessageType(type);
    messageDisplayedRef.current = true; // 메시지가 표시되었음을 기록

    // 1초 후에 메시지 자동으로 사라지도록 설정
    messageTimer = setTimeout(() => {
      setGlobalMessage(null);
      setMessageType(null);
      messageDisplayedRef.current = false; // 메시지 숨김 처리되었음을 기록
    }, 5000); // <--- 여기를 5000ms (5초)로 설정
  };

  // 메시지 수동으로 닫기 (선택 사항)
  const clearGlobalMessage = () => {
    setGlobalMessage(null);
    setMessageType(null);
    if (messageTimer) {
      clearTimeout(messageTimer);
      messageTimer = null;
    }
    messageDisplayedRef.current = false;

  };


  // 보호된 라우트를 위한 헬퍼 컴포넌트
  const ProtectedRoute = ({ showMessage }: { showMessage: (msg: string, type?: 'success' | 'error' | 'warning') => void }) => {
    const navigate = useNavigate();
    const isLoggedIn = localStorage.getItem("user");

    useEffect(() => {
      // 로그인 상태가 아니고, 아직 메시지를 표시하지 않았다면
      if (!isLoggedIn && !messageDisplayedRef.current) {
        showMessage('로그인 후에 이용 가능합니다.', 'warning');
        // 메시지 표시 후 딜레이 없이 바로 리다이렉트 (alert()처럼 동기적으로 멈추지 않음)
        navigate('/login', { replace: true });
      } else if (isLoggedIn && messageDisplayedRef.current) {
        // 로그인 상태인데 메시지가 떠 있다면 메시지 숨기기 (경우에 따라 필요)
        clearGlobalMessage(); // 이 부분을 넣으면 로그인 성공 후 메시지 바로 사라짐
      }
    }, [isLoggedIn, navigate, showMessage]); // showMessage를 의존성 배열에 추가

    return isLoggedIn ? <Outlet /> : null;
  };

  // 전역 메시지를 렌더링하는 내부 컴포넌트
  const GlobalMessageDisplay: React.FC = () => {
    if (!globalMessage) return null;

    const messageClass = `global-message ${messageType || 'info'}`;

    return (
      <div className={messageClass}>
        {globalMessage}
        <button className="close-message-btn" onClick={clearGlobalMessage}>&times;</button>
      </div>
    );
  };

  const isRankingPage = location.pathname === "/ranking";

  return (
    <div className={`App ${isRankingPage ? "ranking-theme" : ""}`}>
      <BrowserRouter>
        const location = useLocation();

        <Header />
        <GlobalMessageDisplay />
        <div>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route element={<ProtectedRoute showMessage={showGlobalMessage} />}>
              <Route path="/" element={<Home />} />
              <Route path="/exercise" element={<Exercise />} />
              <Route path="/video/:videoId" element={<VideoDetail />} />
              <Route path="/video/:videoId/VideoAnalyze" element={<VideoAnalyze />} />
              <Route path="/video/:videoId/purchase" element={<VideoPurchase />} />
              <Route path="/mypage" element={<MyPage />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/dailymissionvideo/:videoId" element={<DailyMissionVideo />} />
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
      <Footer />
    </div>
  );
}

export default App;