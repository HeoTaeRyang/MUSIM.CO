import { useState } from "react";
import "../styles/Login.css";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // 로그인 처리 함수
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // 폼 제출 시 새로고침 방지

    // 로그인 요청 본문 - 백엔드가 요구하는 key에 맞춰 수정
    const loginData = {
      id: userId,
      password: password,
    };

    try {
      const response = await fetch(
        "https://web-production-6e732.up.railway.app/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("로그인 성공:", data);
        localStorage.setItem("user_id", data.user_id); // ← 핵심!
        localStorage.setItem("user", userId); // 기존대로 문자열 ID도 저장
        localStorage.setItem("username", data.username); // 사용자 이름 저장
        navigate("/");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "로그인 실패");
      }
    } catch (error) {
      console.error("로그인 중 오류 발생:", error);
      alert("서버와의 연결에 실패했습니다.");
    }
  };

  return (
    <div className="login-container">
      <h2>로그인</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="아이디"
          className="login-input"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <div className="password-container">
          <input
            type="password"
            placeholder="비밀번호"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="login-options">
          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
            />{" "}
            로그인 상태 유지
          </label>
          <span className="find-account">아이디/비밀번호 찾기</span>
        </div>
        <button className="login-btn" type="submit">
          로그인 하기
        </button>
      </form>
      <button
        className="signup-btn"
        onClick={() => {
          navigate("/signup");
        }}
      >
        회원가입하기
      </button>
    </div>
  );
};

export default Login;
