import { useState } from 'react';
import VideoDetail from './VideoDetail';    // 영상 상세페이지에서 영상+컨트롤바 불러오기
import '../styles/VideoPurchase.css';

const VideoPurchase: React.FC = () => {
    const [showCart, setShowCart] = useState(false);

    // 영상 컨트롤바의 장바구니 버튼 클릭 시
    const handleCartClick = () => setShowCart(true);
    // × 버튼 클릭 시
    const handleClose = () => setShowCart(false);

    return (
        <div className="video-purchase-container">
            {/* 왼쪽: 영상 영역 — 구매 panel 열림 여부에 따라 flex 비율 조정 */}
            <div
                className="video-area"
                style={{ flex: showCart ? 2 : 1 }}
            >
                <VideoDetail onCartClick={handleCartClick} />
            </div>

            {/* 오른쪽: 구매 패널 (열려 있을 때만 렌더링) */}
            {showCart && (
                <div className="purchase-panel">
                    <div className="purchase-header">
                        <h2>상품 구매</h2>
                        <button className="close-btn" onClick={handleClose}>×</button>
                    </div>

                    {/* 임시 데이터*/}
                    <div className="product-card">
                        <img
                            className="product-image"
                            src="../assets/sample_product.png"
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
                </div>
            )}
        </div>
    );
};

export default VideoPurchase;
