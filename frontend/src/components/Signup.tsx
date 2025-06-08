import { useState, ChangeEvent, FormEvent } from "react";
import "../styles/Signup.css";
import { useNavigate } from "react-router-dom";

// Daum Postcode API를 사용하려면 HTML 파일에 <script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
// 이 스크립트 태그가 반드시 추가되어 있어야 합니다.
// (일반적으로 public/index.html 파일에 추가합니다.)

const Signup = () => {
  // 백엔드 파라미터명에 맞춰 변수명 재구성
  const [usertype, setUsertype] = useState<string>("personal"); // memberType -> usertype
  const [userid, setUserid] = useState<string>(""); // id -> userid
  const [password, setPassword] = useState<string>("");
  const [password_confirm, setPassword_confirm] = useState<string>(""); // confirmPassword -> password_confirm
  const [username, setUsername] = useState<string>(""); // name -> username
  const [email, setEmail] = useState<string>("");

  // 일반전화 (tel)을 위한 임시 상태. 최종적으로는 tel 하나로 보냄.
  const [telPrefix, setTelPrefix] = useState<string>("");
  const [telMiddle, setTelMiddle] = useState<string>("");
  const [telSuffix, setTelSuffix] = useState<string>("");

  // 휴대전화 (phone)을 위한 임시 상태. 최종적으로는 phone 하나로 보냄.
  const [phonePrefix, setPhonePrefix] = useState<string>(""); // mobile1 -> phonePrefix
  const [phoneMiddle, setPhoneMiddle] = useState<string>(""); // mobile2 -> phoneMiddle
  const [phoneSuffix, setPhoneSuffix] = useState<string>(""); // mobile3 -> phoneSuffix

  const [zipcode, setZipcode] = useState<string>(""); // zipCode -> zipcode
  const [addr, setAddr] = useState<string>(""); // address1 -> addr
  const [addr_detail, setAddr_detail] = useState<string>(""); // address2 -> addr_detail

  const navigate = useNavigate();

  const handleUsertypeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUsertype(event.target.value);
  };

  const handleUseridChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUserid(event.target.value);
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  const handlePassword_confirmChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setPassword_confirm(event.target.value);
  };

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
  };

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  // 일반전화 핸들러 (tel)
  const handleTelPrefixChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setTelPrefix(event.target.value);
  };
  const handleTelMiddleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTelMiddle(event.target.value);
  };
  const handleTelSuffixChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTelSuffix(event.target.value);
  };

  // 휴대전화 핸들러 (phone)
  const handlePhonePrefixChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setPhonePrefix(event.target.value);
  };
  const handlePhoneMiddleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPhoneMiddle(event.target.value);
  };
  const handlePhoneSuffixChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPhoneSuffix(event.target.value);
  };

  // handleZipcodeChange와 handleAddrChange는 input이 readOnly이므로 제거합니다.
  // 주소는 Daum Postcode API를 통해 직접 상태가 업데이트됩니다.

  const handleAddr_detailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAddr_detail(event.target.value);
  };

  const handleSearchAddress = () => {
    // window.daum에 대한 타입 정의가 global.d.ts에 추가되어야 합니다.
    new window.daum.Postcode({
      oncomplete: function (data: any) {
        let fullAddr = data.address; // 기본 주소
        let extraAddr = "";

        if (data.addressType === "R") {
          if (data.bname !== "") extraAddr += data.bname;
          if (data.buildingName !== "") {
            extraAddr +=
              extraAddr !== "" ? `, ${data.buildingName}` : data.buildingName;
          }
          if (extraAddr !== "") {
            fullAddr += ` (${extraAddr})`;
          }
        }

        setZipcode(data.zonecode); // 우편번호 업데이트
        setAddr(fullAddr); // 기본 주소 업데이트
        setAddr_detail(""); // 상세 주소는 사용자가 다시 입력하도록 초기화
      },
    }).open();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    // 백엔드 요구사항에 맞춰 일반전화와 휴대전화 문자열 조합
    const tel = `${telPrefix}-${telMiddle}-${telSuffix}`;
    const phone = `${phonePrefix}-${phoneMiddle}-${phoneSuffix}`;

    // 백엔드로 보낼 데이터 객체 (키 값을 백엔드 파라미터명과 일치시킴)
    const formData = {
      usertype: usertype,
      id: userid, // 백엔드는 'id'로 받음
      password: password,
      password_confirm: password_confirm,
      username: username,
      addr: addr,
      zipcode: zipcode,
      phone: phone, // 백엔드는 'phone' 하나로 받음 (휴대전화)
      email: email,
      addr_detail: addr_detail, // 선택 입력값
      tel: tel, // 선택 입력값 (일반전화)
    };

    console.log("회원가입 정보 (백엔드로 전송될 데이터):", formData);

    // TODO: 실제 API 호출 로직 구현
    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        navigate("/login"); // 회원가입 성공 후 로그인 페이지로 이동
      } else {
        alert(`회원가입 실패: ${result.error || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("API 호출 중 오류 발생:", error);
      alert("서버와 통신 중 오류가 발생했습니다.");
    }
  };

  const handleCancel = () => {
    navigate("/"); // 취소 후 메인 페이지 또는 이전 페이지로 이동
  };

  return (
    <div className="signup-frame">
      <div className="signup-title" style={{ padding: "80px" }}>
        회원가입
      </div>

      <div className="align-left">회원인증</div>
      <hr />

      <table>
        <tbody>
          {" "}
          {/* table 자식으로는 반드시 tbody, thead, tfoot 중 하나가 와야 합니다. */}
          <tr>
            <td>
              <div
                className="label member-type-label"
                style={{ padding: "10px" }}
              >
                <span className="required">*</span>
                <span>회원구분</span>
                <label style={{ margin: "50px" }}></label>
                <label style={{ margin: "50px" }}>
                  <input
                    type="radio"
                    value="personal"
                    checked={usertype === "personal"} // memberType -> usertype
                    onChange={handleUsertypeChange} // handleMemberTypeChange -> handleUsertypeChange
                  />
                  개인 회원
                </label>
                <label style={{ margin: "50px" }}>
                  <input
                    type="radio"
                    value="instructor"
                    checked={usertype === "instructor"} // memberType -> usertype
                    onChange={handleUsertypeChange} // handleMemberTypeChange -> handleUsertypeChange
                  />
                  강사
                </label>
                <label style={{ margin: "50px" }}>
                  <input
                    type="radio"
                    value="business"
                    checked={usertype === "business"} // memberType -> usertype
                    onChange={handleUsertypeChange} // handleMemberTypeChange -> handleUsertypeChange
                  />
                  사업자
                </label>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <hr />

      <div className="align-left" style={{ fontSize: "18px" }}>
        기본정보
      </div>

      <div className="required-info-text-right">
        <span className="required">*</span>
        <span className="required-text" style={{ fontSize: "18px" }}>
          필수입력사항
        </span>
      </div>

      <hr />

      {/* 아이디 */}
      <table>
        <tbody>
          <tr>
            <td>
              <div className="label id-label" style={{ width: "150px" }}>
                <span className="required">*</span>
                <span>아이디</span>
              </div>
            </td>
            <td style={{ width: "700px" }}>
              <div className="input-box id-input">
                <input
                  type="text"
                  value={userid}
                  onChange={handleUseridChange}
                />{" "}
                {/* id -> userid, handleIdChange -> handleUseridChange */}
              </div>
              <div className="id-rules">(영문소문자/숫자, 4~16자)</div>
            </td>
          </tr>
        </tbody>
      </table>

      <hr />

      {/* 비밀번호 */}
      <table>
        <tbody>
          <tr>
            <td>
              <div className="label password-label" style={{ width: "150px" }}>
                <span className="required">*</span>
                <span>비밀번호</span>
              </div>
            </td>
            <td style={{ width: "700px" }}>
              <div className="input-box password-input">
                <input
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                />
              </div>
              <div className="password-rules">
                (영문 대소문자/숫자/특수문자 총 2가지 이상 조합, 10자~16자)
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <hr />

      {/* 비밀번호 확인 */}
      <table>
        <tbody>
          <tr>
            <td style={{ width: "150px" }}>
              <div className="label confirm-password-label">
                <span className="required">*</span>
                <span>비밀번호 확인</span>
              </div>
            </td>
            <td style={{ width: "700px" }}>
              <div className="input-box confirm-password-input">
                <input
                  type="password"
                  value={password_confirm} // confirmPassword -> password_confirm
                  onChange={handlePassword_confirmChange} // handleConfirmPasswordChange -> handlePassword_confirmChange
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <hr />

      {/* 이름 */}
      <table>
        <tbody>
          <tr>
            <td>
              <div className="label name-label" style={{ width: "150px" }}>
                <span className="required">*</span>
                <span>이름</span>
              </div>
            </td>
            <td style={{ width: "700px" }}>
              <div className="input-box name-input">
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                />{" "}
                {/* name -> username, handleNameChange -> handleUsernameChange */}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <hr />

      {/* 주소 */}
      <table>
        <tbody>
          <tr>
            <td>
              <div className="label address-label" style={{ width: "150px" }}>
                <span className="required">*</span>
                <span>주소</span>
              </div>
            </td>
            <td style={{ width: "700px" }}>
              <div className="input-row">
                <div className="input-box zipcode-input">
                  <input type="text" value={zipcode} readOnly />
                </div>
                <div
                  className="address-search-button"
                  onClick={handleSearchAddress}
                >
                  주소검색
                </div>
              </div>
              <div className="input-box address1-input">
                <input type="text" value={addr} readOnly />
              </div>
              <div className="input-box address2-input">
                <input
                  type="text"
                  value={addr_detail}
                  onChange={handleAddr_detailChange}
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <hr />

      {/* 일반전화 */}
      <table>
        <tbody>
          <tr>
            <td>
              <div className="label phone-label" style={{ width: "150px" }}>
                일반전화
              </div>
            </td>
            <td style={{ width: "150px" }}>
              <div className="input-box phone1-input">
                <select value={telPrefix} onChange={handleTelPrefixChange}>
                  {" "}
                  <option value="">선택</option>
                  <option value="02">02</option>
                  <option value="031">031</option>
                  <option value="032">032</option>
                  <option value="033">033</option>
                  <option value="041">041</option>
                  <option value="042">042</option>
                  <option value="043">043</option>
                  <option value="044">044</option>
                  <option value="051">051</option>
                  <option value="052">052</option>
                  <option value="053">053</option>
                  <option value="054">054</option>
                  <option value="055">055</option>
                  <option value="061">061</option>
                  <option value="062">062</option>
                  <option value="063">063</option>
                  <option value="064">064</option>
                  <option value="070">070</option> {/* 인터넷 전화 */}
                </select>
              </div>
            </td>
            -
            <td style={{ width: "150px" }}>
              <div className="input-box phone2-input">
                <input
                  type="number"
                  value={telMiddle}
                  onChange={handleTelMiddleChange}
                />{" "}
              </div>
            </td>
            -
            <td style={{ width: "150px" }}>
              <div className="input-box phone3-input">
                <input
                  type="number"
                  value={telSuffix}
                  onChange={handleTelSuffixChange}
                />{" "}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <hr />

      {/* 휴대전화 */}
      <table>
        <tbody>
          <tr>
            <td>
              <div className="label mobile-label" style={{ width: "150px" }}>
                <span className="required">*</span>
                <span>휴대전화</span>
              </div>
            </td>
            <td style={{ width: "150px" }}>
              <div className="input-box mobile1-input">
                <select value={phonePrefix} onChange={handlePhonePrefixChange}>
                  {" "}
                  <option value="">선택</option>
                  <option value="010">010</option>
                  <option value="011">011</option>
                  <option value="016">016</option>
                  <option value="017">017</option>
                  <option value="018">018</option>
                  <option value="019">019</option>
                </select>
              </div>
            </td>
            -
            <td style={{ width: "150px" }}>
              <div className="input-box mobile2-input">
                <input
                  type="number"
                  value={phoneMiddle}
                  onChange={handlePhoneMiddleChange}
                />{" "}
              </div>
            </td>
            -
            <td style={{ width: "150px" }}>
              <div className="input-box mobile3-input">
                <input
                  type="number"
                  value={phoneSuffix}
                  onChange={handlePhoneSuffixChange}
                />{" "}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <hr />

      {/* 이메일 */}
      <table>
        <tbody>
          <tr>
            <td>
              <div className="label email-label" style={{ width: "150px" }}>
                <span className="required">*</span>
                <span>이메일</span>
              </div>
            </td>
            <td style={{ width: "700px" }}>
              <div className="input-box email-input">
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <hr />

      {/* 버튼 */}
      <table style={{ display: "block", margin: "0 auto" }}>
        <tbody>
          <tr>
            <td style={{ width: "450px", height: "100px" }}>
              <div className="cancel-button" onClick={handleCancel}>
                취소
              </div>
            </td>
            <td style={{ width: "450px", height: "100px" }}>
              <div className="signup-button" onClick={handleSubmit}>
                가입하기
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Signup;