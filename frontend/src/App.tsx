import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, Outlet } from "react-router-dom";
import Header from "./components/Header";
import Home from "./components/Home";
import Footer from "./components/Footer";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Exercise from "./components/exercise";
import VideoDetail from "./components/VideoDetail";
import VideoAnalyze from "./components/VideoAnalyze";
import VideoPurchase from "./components/VideoPurchase";
import Diet from "./components/Diet";
import MyPage from "./components/mypage";

import "./App.css";

// 보호된 라우트를 위한 헬퍼 컴포넌트
const ProtectedRoute = () => {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("user"); // 'user' 키로 로그인 상태를 확인

  useEffect(() => {
    if (!isLoggedIn) {
      // 로그인 상태가 아니면 로그인 페이지로 리다이렉트하면서 메시지 전달
      navigate('/login', {
        replace: true, // 뒤로가기 시 로그인 페이지로 다시 돌아가지 않게 함
        state: { message: '로그인 후에 이용 가능합니다.' } // <--- 이 부분 추가: 메시지 전달
      });
    }
  }, [isLoggedIn, navigate]);

  // 로그인 상태이면 요청된 컴포넌트 렌더링
  return isLoggedIn ? <Outlet /> : null;
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Header />
        <div>
          <Routes>
            {/* --- 보호되지 않는 라우트 (로그인 없이 접근 가능) --- */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* --- 보호된 라우트들 (로그인 필요) --- */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Home />} />
              <Route path="/exercise" element={<Exercise />} />
              <Route path="/video/:videoId" element={<VideoDetail />} />
              <Route
                path="/video/:videoId/VideoAnalyze"
                element={<VideoAnalyze />}
              />
              <Route
                path="/video/:videoId/purchase"
                element={<VideoPurchase />}
              />
              <Route path="/diet" element={<Diet />} />
              <Route path="/mypage" element={<MyPage />} />
              {/* 여기에 다른 보호되어야 할 라우트들을 추가하세요. */}
            </Route>

            {/* --- 404 Not Found 페이지 (선택 사항, 보호된 라우트 밖에 배치) --- */}
            {/* <Route path="*" element={<div>404 Not Found</div>} /> */}
          </Routes>
        </div>
      </BrowserRouter>
      <Footer />
    </div>
  );
}

export default App;