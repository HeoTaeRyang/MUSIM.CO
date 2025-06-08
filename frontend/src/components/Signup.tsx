import { useState, ChangeEvent, FormEvent } from "react";
import "../styles/Signup.css";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [usertype, setUsertype] = useState<string>("personal");
  const [userid, setUserid] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [password_confirm, setPassword_confirm] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  const [telPrefix, setTelPrefix] = useState<string>("");
  const [telMiddle, setTelMiddle] = useState<string>("");
  const [telSuffix, setTelSuffix] = useState<string>("");

  const [phonePrefix, setPhonePrefix] = useState<string>("");
  const [phoneMiddle, setPhoneMiddle] = useState<string>("");
  const [phoneSuffix, setPhoneSuffix] = useState<string>("");

  const [zipcode, setZipcode] = useState<string>("");
  const [addr, setAddr] = useState<string>("");
  const [addr_detail, setAddr_detail] = useState<string>("");

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

  const handleTelPrefixChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setTelPrefix(event.target.value);
  };
  const handleTelMiddleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTelMiddle(event.target.value);
  };
  const handleTelSuffixChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTelSuffix(event.target.value);
  };

  const handlePhonePrefixChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setPhonePrefix(event.target.value);
  };
  const handlePhoneMiddleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPhoneMiddle(event.target.value);
  };
  const handlePhoneSuffixChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPhoneSuffix(event.target.value);
  };

  const handleAddr_detailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAddr_detail(event.target.value);
  };

  const handleSearchAddress = () => {
    new window.daum.Postcode({
      oncomplete: function (data: any) {
        let fullAddr = data.address;
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

        setZipcode(data.zonecode);
        setAddr(fullAddr);
        setAddr_detail("");
      },
    }).open();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const tel = `${telPrefix}-${telMiddle}-${telSuffix}`;
    const phone = `${phonePrefix}-${phoneMiddle}-${phoneSuffix}`;

    const formData = {
      usertype: usertype,
      id: userid,
      password: password,
      password_confirm: password_confirm,
      username: username,
      addr: addr,
      zipcode: zipcode,
      phone: phone,
      email: email,
      addr_detail: addr_detail,
      tel: tel,
    };

    console.log("회원가입 정보 (백엔드로 전송될 데이터):", formData);

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
        navigate("/login");
      } else {
        alert(`회원가입 실패: ${result.error || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("API 호출 중 오류 발생:", error);
      alert("서버와 통신 중 오류가 발생했습니다.");
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <div className="signup-frame">
      <div className="signup-title">회원가입</div> {/* style 제거 */}

      <div className="align-left">회원인증</div>
      <hr />

      <table>
        <tbody>
          <tr>
            <td>
              {/* member-type-label의 padding 제거, member-type-option 클래스 추가 */}
              <div className="label member-type-label">
                <span className="required">*</span>
                <span>회원구분</span>
                {/* 비어있는 label 제거 */}
                <label className="member-type-option">
                  <input
                    type="radio"
                    value="personal"
                    checked={usertype === "personal"}
                    onChange={handleUsertypeChange}
                  />
                  개인 회원
                </label>
                <label className="member-type-option">
                  <input
                    type="radio"
                    value="instructor"
                    checked={usertype === "instructor"}
                    onChange={handleUsertypeChange}
                  />
                  강사
                </label>
                <label className="member-type-option">
                  <input
                    type="radio"
                    value="business"
                    checked={usertype === "business"}
                    onChange={handleUsertypeChange}
                  />
                  사업자
                </label>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <hr />

      <div className="align-left basic-info-title">
        기본정보
      </div>

      <div className="required-info-text-right">
        <span className="required">*</span>
        <span className="required-text required-info-text-span">
          필수입력사항
        </span>
      </div>

      <hr />

      {/* 아이디 */}
      <table>
        <tbody>
          <tr>
            <td>
              <div className="label id-label"> {/* width 제거 */}
                <span className="required">*</span>
                <span>아이디</span>
              </div>
            </td>
            <td> {/* width 제거 */}
              <div className="input-box id-input">
                <input
                  type="text"
                  value={userid}
                  onChange={handleUseridChange}
                />
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
              <div className="label password-label"> {/* width 제거 */}
                <span className="required">*</span>
                <span>비밀번호</span>
              </div>
            </td>
            <td> {/* width 제거 */}
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
            <td> {/* width 제거 */}
              <div className="label confirm-password-label">
                <span className="required">*</span>
                <span>비밀번호 확인</span>
              </div>
            </td>
            <td> {/* width 제거 */}
              <div className="input-box confirm-password-input">
                <input
                  type="password"
                  value={password_confirm}
                  onChange={handlePassword_confirmChange}
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
              <div className="label name-label"> {/* width 제거 */}
                <span className="required">*</span>
                <span>이름</span>
              </div>
            </td>
            <td> {/* width 제거 */}
              <div className="input-box name-input">
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                />
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
              <div className="label address-label"> {/* width 제거 */}
                <span className="required">*</span>
                <span>주소</span>
              </div>
            </td>
            <td> {/* width 제거 */}
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
              <div className="label phone-label"> {/* width 제거 */}
                일반전화
              </div>
            </td>
            <td className="phone-group-container"> {/* phone-group-container 클래스 추가 */}
              <div className="phone-group"> {/* phone-group으로 감싸서 flex 적용 */}
                <div className="input-box phone1-input">
                  <select value={telPrefix} onChange={handleTelPrefixChange}>
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
                    <option value="070">070</option>
                  </select>
                </div>
                <span className="phone-separator">-</span> {/* 하이픈을 span으로 감싸기 */}
                <div className="input-box phone2-input">
                  <input
                    type="number"
                    value={telMiddle}
                    onChange={handleTelMiddleChange}
                  />
                </div>
                <span className="phone-separator">-</span> {/* 하이픈을 span으로 감싸기 */}
                <div className="input-box phone3-input">
                  <input
                    type="number"
                    value={telSuffix}
                    onChange={handleTelSuffixChange}
                  />
                </div>
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
              <div className="label mobile-label"> {/* width 제거 */}
                <span className="required">*</span>
                <span>휴대전화</span>
              </div>
            </td>
            <td className="mobile-group-container"> {/* mobile-group-container 클래스 추가 */}
              <div className="mobile-group"> {/* mobile-group으로 감싸서 flex 적용 */}
                <div className="input-box mobile1-input">
                  <select value={phonePrefix} onChange={handlePhonePrefixChange}>
                    <option value="">선택</option>
                    <option value="010">010</option>
                    <option value="011">011</option>
                    <option value="016">016</option>
                    <option value="017">017</option>
                    <option value="018">018</option>
                    <option value="019">019</option>
                  </select>
                </div>
                <span className="phone-separator">-</span> {/* 하이픈을 span으로 감싸기 */}
                <div className="input-box mobile2-input">
                  <input
                    type="number"
                    value={phoneMiddle}
                    onChange={handlePhoneMiddleChange}
                  />
                </div>
                <span className="phone-separator">-</span> {/* 하이픈을 span으로 감싸기 */}
                <div className="input-box mobile3-input">
                  <input
                    type="number"
                    value={phoneSuffix}
                    onChange={handlePhoneSuffixChange}
                  />
                </div>
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
              <div className="label email-label"> {/* width 제거 */}
                <span className="required">*</span>
                <span>이메일</span>
              </div>
            </td>
            <td> {/* width 제거 */}
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
      <table className="button-table"> {/* 클래스 추가 */}
        <tbody>
          <tr>
            <td> {/* width, height 제거 */}
              <div className="cancel-button" onClick={handleCancel}>
                취소
              </div>
            </td>
            <td> {/* width, height 제거 */}
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