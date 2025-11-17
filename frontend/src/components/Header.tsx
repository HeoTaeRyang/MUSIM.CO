import { Link, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import "../styles/Header.css";
import logo from "../assets/logo.png";

const Header = () => {
  const navigate = useNavigate();

  // 로그인 여부 확인
  const isLoggedIn = localStorage.getItem("user"); // 로그인한 사용자 정보 확인 (localStorage 예시)

  // User 아이콘 클릭 시 로그인 여부에 따른 페이지 이동
  const handleUserClick = () => {
    if (isLoggedIn) {
      navigate("/mypage"); // 로그인 상태면 Mypage로 이동
    } else {
      navigate("/login"); // 로그인 상태가 아니면 Login 페이지로 이동
    }
  };

  return (
    <header className="header">
      <div className="header-top">
        <div className="logo">
          <Link to="/">
            <img src={logo} alt="Logo" className="logo-img" />
          </Link>
        </div>
        <div className="icons">
          {/* <Bell className="icon" />
          <Star className="icon" />
          <ShoppingCart className="icon" />
          <Search className="icon" /> */}
          <User className="icon" onClick={handleUserClick} />{" "}
          {/* User 아이콘 클릭 시 로그인 상태에 맞는 페이지로 이동 */}
        </div>
      </div>

      <nav className="menu">
        <Link to="/">홈</Link>
        <Link to="/ranking">랭킹</Link>
        <Link to="/exercise">운동</Link>
        {/* <button
                    className="shop-button"
                    onClick={() =>
                        alert("제품 구매 배너는 존재하지만, 제품 구매 페이지는 준비중입니다")
                    }
                    style={{
                        background: "none",
                        border: "none",
                        color: "inherit",
                        cursor: "pointer",
                        font: "inherit",
                        padding: 0,
                    }}
                >
                    제품구매
                </button> */}
      </nav>
    </header>
  );
};

export default Header;
