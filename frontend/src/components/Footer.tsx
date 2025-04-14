import { Phone, Instagram, Youtube, MessageSquare } from 'lucide-react';
import '../styles/Footer.css';

const Footer = () => {
    return (
        <div className="footer-container">
            {/* 상단: 메뉴 + 아이콘 한 줄 */}
            <div className="footer-top">
                <div className="footer-menu">
                    <a href="#">브랜드소개</a>
                    <a href="#">이용약관</a>
                    <a href="#">개인정보처리방침</a>
                    <a href="#">이용안내</a>
                    <a href="#">검사/사업자 인증</a>
                </div>
                <div className="footer-icons">
                    <a href="tel:15440000"><Phone size={24} /></a>
                    <a href="https://instagram.com"><Instagram size={24} /></a>
                    <a href="https://youtube.com"><Youtube size={24} /></a>
                    <a href="mailto:support@musim.co"><MessageSquare size={24} /></a>
                </div>
            </div>

            {/* 하단: 고객센터 / 브랜드 정보 */}
            <div className="footer-bottom">
                <div className="footer-customer">
                    <p>고객센터</p>
                    <p><strong>카카오톡 @무심코</strong></p>
                    <p><strong>1544-0000</strong></p>
                    <p>운영시간 : 평일 10:00~17:00</p>
                    <p>(점심시간 12:00~13:00 / 토,일,공휴일 휴무)</p>
                </div>

                <div className="footer-brand">
                    <p><strong>브랜드 정보</strong></p>
                    <p>(주)무심코 | 대표 허윤은</p>
                    <p>대구광역시 달서구 성당동 695-13</p>
                    <p>364-11-00011 (사업자등록번호)</p>
                    <p>2025-대구달서구-0000호 | 개인정보관리책임자 허윤은</p>
                    <p>COPYRIGHT ⓒ (주)무심코 ALL RIGHTS RESERVED. DESIGNED BY MUSIMCO</p>
                </div>
            </div>
        </div>
    );
};

export default Footer;
