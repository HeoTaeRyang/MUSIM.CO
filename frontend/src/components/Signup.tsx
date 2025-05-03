

import { useState, ChangeEvent, FormEvent } from "react";
import "../styles/Signup.css";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [memberType, setMemberType] = useState<string>("personal");
  const [id, setId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [tel1, setTel1] = useState<string>("");
  const [tel2, setTel2] = useState<string>("");
  const [tel3, setTel3] = useState<string>("");
  const [mobile1, setMobile1] = useState<string>("");
  const [mobile2, setMobile2] = useState<string>("");
  const [mobile3, setMobile3] = useState<string>("");
  const [zipCode, setZipCode] = useState<string>("");
  const [address1, setAddress1] = useState<string>("");
  const [address2, setAddress2] = useState<string>("");
  const navigate = useNavigate();

  const handleMemberTypeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setMemberType(event.target.value);
  };

  const handleIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    setId(event.target.value);
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handleConfirmPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(event.target.value);
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

// 일반전화
  const handleTel1Change = (event: ChangeEvent<HTMLSelectElement>) => {
  setTel1(event.target.value);
  };
  const handleTel2Change = (event: ChangeEvent<HTMLInputElement>) => {
  setTel2(event.target.value);
  };
  const handleTel3Change = (event: ChangeEvent<HTMLInputElement>) => {
  setTel3(event.target.value);
  };

// 휴대전화
  const handleMobile1Change = (event: ChangeEvent<HTMLSelectElement>) => {
  setMobile1(event.target.value);
};
  const handleMobile2Change = (event: ChangeEvent<HTMLInputElement>) => {
  setMobile2(event.target.value);
};
  const handleMobile3Change = (event: ChangeEvent<HTMLInputElement>) => {
  setMobile3(event.target.value);
};

  const handleZipCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setZipCode(event.target.value);
  };

  const handleAddress1Change = (event: ChangeEvent<HTMLInputElement>) => {
    setAddress1(event.target.value);
  };

  const handleAddress2Change = (event: ChangeEvent<HTMLInputElement>) => {
    setAddress2(event.target.value);
  };

  const handleSearchAddress = () => {
    // 주소 검색 로직 (API 연동 등) 필요
    alert("주소 검색 기능 구현 필요");
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // 회원가입 처리 로직 (API 연동 등) 필요
    console.log("회원가입 정보:", {
      memberType,
      id,
      password,
      confirmPassword,
      name,
      email,
      phone: `일반 ${tel1}-${tel2}-${tel3}, 휴대 ${mobile1}-${mobile2}-${mobile3}`,
      zipCode,
      address: `${address1} ${address2}`,
    });
    alert("회원가입 처리!");
    // navigate('/login'); // 회원가입 성공 후 로그인 페이지로 이동 (선택 사항)
  };

  const handleCancel = () => {
    navigate("/"); // 취소 후 메인 페이지 또는 이전 페이지로 이동 (선택 사항)
  };

  return (
    <div className="signup-frame">
      <div className="signup-title" style={{padding:"80px"}}>회원가입</div>
      <div className="align-left">회원인증</div>
      < hr/>
      <table>
        <tr>
          <td>
      <div className="label member-type-label" style={{ padding: "10px" }}>
        <span className="required">*</span>
        <span>회원구분</span>
        <label style={{ margin: "50px" }}></label>
        <label style={{ margin: "50px" }}>
          <input
            type="radio"
            value="personal"
            checked={memberType === "personal"}
            onChange={handleMemberTypeChange}
          />
          개인 회원
        </label>
        <label style={{ margin: "50px" }}>
          <input
            type="radio"
            value="instructor"
            checked={memberType === "instructor"}
            onChange={handleMemberTypeChange}
          />
          강사
        </label>
        <label style={{ margin: "50px" }}>
          <input
            type="radio"
            value="business"
            checked={memberType === "business"}
            onChange={handleMemberTypeChange}
          />
          사업자
        </label>
      </div>
      </td>
        </tr>
      </table>
      <hr/>
    
      <div className="align-left" style={{fontSize:"18px"}}>기본정보</div>
      <div className="required-info-text-right">
        </div>

      <div className = "required-info-text-right">
      <span className="required">*</span>
        <span className="required-text" style={{fontSize:"18px"}}>필수입력사항</span>
        </div>

      <hr/>
      <table>
      <tr>
      <td>
        <div className="label id-label" style={{width: "150px"}}>
        <span className="required">*</span>
        <span>아이디</span>
        </div>
      </td>
      
      <td style={{ width: "700px" }}>
      <div className="input-box id-input">
        <input type="text" value={id} onChange={handleIdChange} />
      </div>
      <div className="id-rules">(영문소문자/숫자, 4~16자)</div>
      </td>
        </tr>
      </table>
      <hr/>
      <table>
        <tr>
         <td><div className="label password-label" style={{width: "150px"}}>
        <span className="required">*</span>
        <span>비밀번호</span>
      </div></td>
      
      <td style={{ width: "700px" }}>
      <div className="input-box password-input" >
        <input type="password" value={password} onChange={handlePasswordChange} />
      </div>
      <div className="password-rules">
        (영문 대소문자/숫자/특수문자 총 2가지 이상 조합, 10자~16자)
      </div>
      </td>
        </tr>
      </table>
      <hr/>
      <table>
        <tr>
         <td style={{width: "150px"}}>
         <div className="label confirm-password-label">
        <span className="required">*</span>
        <span>비밀번호 확인</span>
      </div>
         </td>
      
      <td style={{ width: "700px" }}>
      <div className="input-box confirm-password-input">
        <input
          type="password"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
        />
      </div>
      </td>
      </tr>
      </table>
      <hr/>

      <table>
        <tr>
         <td>
         <div className="label name-label" style={{width:"150px"}}>
        <span className="required">*</span>
        <span>이름</span>
        </div>
         </td>
      <td style={{ width: "700px" }}>
      <div className="input-box name-input">
        <input type="text" value={name} onChange={handleNameChange} />
      </div>
      </td>
        </tr>
      </table>
      <hr/>

      <table>
        <tr>
         <td><div className="label address-label" style={{width:"150px"}}>
        <span className="required">*</span>
        <span>주소</span>
      </div></td>
      
      <td style={{ width: "700px" }}>
  {/* zipCode input + 주소검색 버튼 묶는 flex 컨테이너 */}
  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
    <div className="input-box zipcode-input">
      <input
        type="text"
        value={zipCode}
        onChange={handleZipCodeChange}
        readOnly
      />
    </div>
    <div className="address-search-button" onClick={handleSearchAddress}>
      주소검색
    </div>
  </div>

  {/* 주소 입력 1 */}
  <div className="input-box address1-input">
    <input
      type="text"
      value={address1}
      onChange={handleAddress1Change}
      readOnly
    />
  </div>

  {/* 주소 입력 2 */}
  <div className="input-box address2-input">
    <input
      type="text"
      value={address2}
      onChange={handleAddress2Change}
    />
  </div>
      </td>
        </tr>
      </table>

    <hr/>
   
    <table>
        <tr>
         <td>
         <div className="label phone-label" style={{width:"150px"}}>일반전화</div>
         </td>
      <td style={{ width: "150px" }}>
      <div className="input-box phone1-input">
        <select value={tel1} onChange={handleTel1Change}>
          <option value="02">02</option>
          <option value="031">031</option>
          {/* ... 기타 지역번호 ... */}
        </select>
      </div>
      </td>
      -
      <td style={{ width: "150px" }}>
      <div className="input-box phone2-input">
        <input type="number" value={tel2} onChange={handleTel2Change} />
      </div>
      </td>
      -
      <td style={{ width: "150px" }}>
      <div className="input-box phone3-input">
        <input type="number" value={tel3} onChange={handleTel3Change} />
      </div>
      </td>
        </tr>
      </table>
      <hr/>
      <table>
        <tr>
         <td>
         <div className="label mobile-label" style={{ width: "150px" }}>
        <span className="required">*</span>
        <span>휴대전화</span>
      </div>
         </td>
      <td style={{ width: "150px" }}>
      <div className="input-box mobile1-input">
        <select value={mobile1} onChange={handleMobile1Change}>
          <option value="010">010</option>
          <option value="011">011</option>
          {/* ... 기타 이동통신 번호 ... */}
        </select>
      </div>
      </td>
      -
      <td style={{ width: "150px" }}>
      <div className="input-box mobile2-input">
        <input type="number" value={mobile2} onChange={handleMobile2Change} />
      </div>
      </td>
      -
      <td style={{ width: "150px" }}>
      <div className="input-box mobile3-input">
        <input type="number" value={mobile3} onChange={handleMobile3Change} />
      </div>
      </td>
        </tr>
      </table>

      <hr/>

      <table>
        <tr>
        <td>
          <div className="label email-label" style={{width:"150px"}}>
        <span className="required">*</span>
        <span>이메일</span>
      </div>
         </td>
      <td style={{ width: "700px" }}>
      <div className="input-box email-input">
        <input type="email" value={email} onChange={handleEmailChange} />
      </div>
      </td>
        </tr>
      </table>
    <hr/>

    <table style={{ display: 'block', margin: '0 auto' }}>
      <tr>
      <td style={{width:"450px", height:"100px"}}>
        <div className="cancel-button" onClick={handleCancel}>
        취소
        </div>
        </td>
        <td style={{width:"450px", height:"100px"}}>
        <div className="signup-button" onClick={handleSubmit}>
        가입하기
      </div>
        </td>
      </tr>
    </table>
    </div>
  );
};

export default Signup;
