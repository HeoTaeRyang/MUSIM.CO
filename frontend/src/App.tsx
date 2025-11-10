import React, { useState, useEffect } from "react";
// useLocation은 BrowserRouter 안에서만 사용 가능하므로,
// App 컴포넌트 자체에서 사용하려면 별도의 래퍼 컴포넌트가 필요합니다.
// 여기서는 isRankingPage를 확인하는 로직을 BrowserRouter 밖으로 빼는 것을 고려하거나,
// App 컴포넌트를 라우팅 컨텍스트 안으로 넣는 구조 변경이 필요할 수 있습니다.
// 일단 현재 구조에서 오류 안나는 방향으로 useLocation 사용을 조정합니다.
import { BrowserRouter, Routes, Route, useNavigate, Outlet } from "react-router-dom"; // useLocation 제거
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
import DailyMissionSelect from "./components/DailyMissionSelect"; // 미션선택 추가
import DailyMissionLeg from "./components/DailyMissionLeg"; // 레그레이즈 페이지 추가

function App() {
  // 메시지를 위한 상태
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'warning' | null>(null);
  const messageDisplayedRef = React.useRef(false);

  // NodeJS.Timeout 대신 number 타입을 사용합니다. (이것은 올바른 수정입니다)
  let messageTimer: number | null = null;

  const showGlobalMessage = (msg: string, type: 'success' | 'error' | 'warning' = 'error') => {
    if (globalMessage === msg && messageType === type) {
      return;
    }
    if (messageTimer) {
      clearTimeout(messageTimer);
      messageTimer = null;
    }
    setGlobalMessage(msg);
    setMessageType(type);
    messageDisplayedRef.current = true;
    messageTimer = setTimeout(() => {
      setGlobalMessage(null);
      setMessageType(null);
      messageDisplayedRef.current = false;
    }, 5000);
  };

  const clearGlobalMessage = () => {
    setGlobalMessage(null);
    setMessageType(null);
    if (messageTimer) {
      clearTimeout(messageTimer);
      messageTimer = null;
    }
    messageDisplayedRef.current = false;
  };

  const ProtectedRoute = ({ showMessage }: { showMessage: (msg: string, type?: 'success' | 'error' | 'warning') => void }) => {
    const navigate = useNavigate();
    const isLoggedIn = localStorage.getItem("user");

    useEffect(() => {
      if (!isLoggedIn && !messageDisplayedRef.current) {
        showMessage('로그인 후에 이용 가능합니다.', 'warning');
        navigate('/login', { replace: true });
      } else if (isLoggedIn && messageDisplayedRef.current) {
        clearGlobalMessage();
      }
    }, [isLoggedIn, navigate, showMessage]);

    return isLoggedIn ? <Outlet /> : null;
  };

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



  return (
    // isRankingPage 조건부 클래스 제거 (useLocation 사용 안 함)
    <div className="App">
      <BrowserRouter>
        {/*
          useLocation 훅은 BrowserRouter 안에 있는 컴포넌트에서만 사용 가능합니다.
          App 컴포넌트가 BrowserRouter를 포함하고 있으므로, App 컴포넌트 자체에서는
          useLocation을 직접 호출할 수 없습니다.

          만약 Header에서 location을 사용한다면, Header 컴포넌트 내에서 useLocation을 호출해야 합니다.
        */}
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
              <Route path="/daily-mission/select" element={<DailyMissionSelect />} />
              <Route path="/daily-mission/video" element={<DailyMissionVideo />} />
              <Route path="/daily-mission/leg" element={<DailyMissionLeg />} />
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
      <Footer />
    </div>
  );
}

export default App;