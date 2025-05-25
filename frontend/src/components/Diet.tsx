import { useNavigate } from 'react-router-dom';
import "../styles/Diet.css";
import carbo from "../assets/carbo.png";
import fat from "../assets/fat.png";
import protein from "../assets/protein.png";

type DietProps = {
  userName: string;
};

type NutrientProps = {
  carboPercent: number;
  fatPercent: number;
  proteinPercent: number;
};

const DietTriangle = ({ carboPercent, fatPercent, proteinPercent }: NutrientProps) => {
  const data = [
    { name: "carbo", src: carbo, percent: carboPercent },
    { name: "fat", src: fat, percent: fatPercent },
    { name: "protein", src: protein, percent: proteinPercent },
  ];

  const max = Math.max(carboPercent, fatPercent, proteinPercent);

  const nameMap: Record<string, string> = {
    carbo: "탄수화물",
    fat: "지방",
    protein: "단백질",
  };

  const renderImage = (item: { name: string; src: string; percent: number }) => {
    const isMax = item.percent === max;

    return (
      <div
        className={`diet-triangle__item ${
          isMax ? "diet-triangle__item--active" : "diet-triangle__item--inactive"
        }`}
        key={item.name}
      >
        <img src={item.src} alt={item.name} style={{ width: "230px", height: "230px" }} />
        {isMax && <div className="diet-triangle__percent">{item.percent}%</div>}

        {/* 툴팁 */}
        <div className="diet-triangle__tooltip">
          {nameMap[item.name]} {item.percent}% ({item.percent}g / 100g)
        </div>
      </div>
    );
  };

  return (
    <div className="diet-triangle">
      <div className="diet-triangle__top">{renderImage(data[0])}</div>
      <div className="diet-triangle__bottom">
        {renderImage(data[1])}
        {renderImage(data[2])}
      </div>
    </div>
  );
};

const Diet = ({ userName = "뚱땅" }: DietProps) => {
    const navigate = useNavigate();
    const handleClick = () => {
        navigate('/'); // 이동할 라우트 경로
      };
    {/* 임의로 넣은 점수 */}
    const score = 80;
    const getScoreMessage = (score: number) => {
      if (score >= 90) return "밸런스가 완벽해요!";
      if (score >= 70) return "꽤 괜찮은 식단이에요.";
      if (score >= 50) return "조금 더 신경써볼까요?";
      return "식단 개선이 필요해요!";
    };

  return (
    <div className="diet-container">
      <div className="diet-title">{userName} 님의 식단 분석</div>
        
        {/*임시로 넣어놓음*/}
      <DietTriangle carboPercent={10} fatPercent={11} proteinPercent={51} />
        
      <div className="dietsc">한끼점수</div>
      <table>
        <tbody>
          <tr>
            <td className="dietsc__score">{score}</td>
            <td className="dietsc__unit">점</td>
          </tr>
        </tbody>
      </table>
      <div className="dietsc__message">{getScoreMessage(score)}</div>

      <button className="confirm-button" onClick={handleClick}>확인</button>
    </div>
  );
};

export default Diet;
