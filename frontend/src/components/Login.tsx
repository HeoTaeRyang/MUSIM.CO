// src/components/Login.jsx
import React from "react";
import "../styles/Login.css"; // 스타일 파일은 따로 만들어줘야 함

const Login = () => {
  return (
    <div className="login-container">
      <h2>로그인</h2>
      <input type="text" placeholder="아이디" className="login-input" />
      <div className="password-container">
        <input type="password" placeholder="비밀번호" className="login-input" />
      </div>
      <div className="login-options">
        <label>
          <input type="checkbox" /> 로그인 상태 유지
        </label>
        <span className="find-account">아이디/비밀번호</span>
      </div>
      <button className="login-btn">로그인 하기</button>
      <button className="signup-btn">회원가입하기</button>
    </div>
  );
};

export default Login;
