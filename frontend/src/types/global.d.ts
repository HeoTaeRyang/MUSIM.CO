// src/types/global.d.ts

// 다음 우편번호 서비스의 Postcode 객체에 대한 타입 정의
interface DaumPostcode {
  open: (options?: object) => void;
}

interface Daum {
  Postcode: new (options?: object) => DaumPostcode;
}

// 전역 Window 객체에 'daum' 속성을 추가합니다.
interface Window {
  daum: Daum;
}