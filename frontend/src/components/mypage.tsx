import { useNavigate } from "react-router-dom";

const MyPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user"); // 로그인 정보 제거
    navigate("/login"); // 로그인 페이지로 이동
  };

  return (
    <div
      className="mypage-container"
      style={{ paddingTop: "100px", textAlign: "center" }}
    >
      <h2>마이페이지</h2>

      <button onClick={handleLogout} className="logout-btn">
        로그아웃
      </button>
    </div>
  );
};

export default MyPage;
