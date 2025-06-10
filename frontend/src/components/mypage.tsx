import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Mypage.css";

const API_BASE_URL = "https://web-production-6e732.up.railway.app";

interface UserInfo {
  id: string;
  username: string;
  addr: string;
  addr_detail: string;
  zipcode: string;
  tel: string;
  phone: string;
  email: string;

  point: number;
}

const MyPage = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const user_id = localStorage.getItem("user_id");
    if (!user_id) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    axios
      .post(`${API_BASE_URL}/myPage`, { user_id })
      .then((res) => setUserInfo(res.data))
      .catch((err) => {
        console.error("회원정보 불러오기 실패:", err);
        alert("회원정보를 불러오는 데 실패했습니다.");
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user_id"); // 로그인 정보 제거
    navigate("/login"); // 로그인 페이지로 이동
  };

  return (
    <div
      className="mypage-container"
      style={{ paddingTop: "100px", textAlign: "center" }}
    >
      <h2>마이페이지</h2>

      {userInfo ? (
        <div className="user-info">
          <p>
            <strong>아이디:</strong> <span>{userInfo.id}</span>
          </p>
          <p>
            <strong>이름:</strong> <span>{userInfo.username}</span>
          </p>
          <p>
            <strong>주소:</strong>{" "}
            <span>
              {userInfo.addr} {userInfo.addr_detail}
            </span>
          </p>
          <p>
            <strong>우편번호:</strong> <span>{userInfo.zipcode}</span>
          </p>
          <p>
            <strong>전화:</strong> <span>{userInfo.tel}</span>
          </p>
          <p>
            <strong>휴대폰:</strong> <span>{userInfo.phone}</span>
          </p>
          <p>
            <strong>이메일:</strong> <span>{userInfo.email}</span>
          </p>
          <p>
            <strong>포인트:</strong> <span>{userInfo.point}점</span>
          </p>
        </div>
      ) : (
        <p>회원 정보를 불러오는 중입니다...</p>
      )}

      <button onClick={handleLogout} className="logout-btn">
        로그아웃
      </button>
    </div>
  );
};

export default MyPage;
