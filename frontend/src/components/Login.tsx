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

    // 로그인 요청 본문
    const loginData = {
      userId,
      password,
      rememberMe,
    };

    try {
      // 서버에 로그인 요청 보내기
      const response = await fetch("http://127.0.0.1:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      if (response.ok) {

        const data = await response.json();
        console.log("로그인 성공:", data);
        // 로그인 성공 시 로컬 스토리지에 userId 저장 
        localStorage.setItem("user", userId);

        // 로그인 성공 시, 리디렉션 처리나 추가적인 상태 변경 가능
      } else {
        console.error("로그인 실패");
      }
    } catch (error) {
      console.error("로그인 중 오류 발생:", error);
    }
  };

  return (
    <div className="login-container">
      <h2>로그인</h2>
      <form onSubmit={handleLogin}>
        {" "}
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
          {" "}
          로그인 하기
        </button>
      </form>
      <button className="signup-btn"
        onClick={() => {
          navigate("/signup");
        }}>
        회원가입하기</button>
    </div>
  );
};

export default Login;
