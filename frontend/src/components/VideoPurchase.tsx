import { useState } from "react";
import { useLocation } from "react-router-dom";
import VideoDetail from "./VideoDetail";
import "../styles/VideoPurchase.css";

const VideoPurchase: React.FC = () => {
  const [showCart, setShowCart] = useState(true); // 처음부터 패널 열려있게!
  const location = useLocation();

  // VideoDetail에서 state로 넘긴 영상 정보 받기
  const video = location.state?.video || {
    id: "sample",
    title: "샘플 영상",
    video: "/assets/sample_video.mp4",
  };

  // (이 아래는 네가 쓰던 코드 그대로)
  const handleCartClick = () => setShowCart(true);
  const handleClose = () => setShowCart(false);

  return (
    <div className="video-purchase-container">
      {/* 영상 영역 */}
      <div className="video-area" style={{ flex: showCart ? 2 : 1 }}>
        <VideoDetail
          videoId={video.id}
          videoSrc={video.video} // ★ 현재 영상 정보 전달!
          onCartClick={handleCartClick}
          hideComments
        />
      </div>
      <div className={`purchase-panel${showCart ? " open" : ""}`}>
        {showCart && (
          <>
            <div className="purchase-header">
              <h2>상품 구매</h2>
              <button className="close-btn" onClick={handleClose}>
                ×
              </button>
            </div>
            <div className="product-card">
              <img
                className="product-image"
                src="/assets/sample_product.png"
                alt="상품 이미지"
              />
              <div className="product-info">
                <h3>에어릭 벤트 숏슬리브 티셔츠</h3>
                <div className="price">54,000원</div>
                <div className="color-options">
                  <span className="color-dot grey" />
                  <span className="color-dot white" />
                  <span className="color-dot blue" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoPurchase;
