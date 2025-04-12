import '../styles/Home.css';
import musimImage from '../assets/musim.png'; // 이미지 경로


const Home = () => {
    return (
        <div className="home-container">
            <div className="background-rectangle">
                <div className="text-container">
                    <h2>오늘의 운동 추천</h2>
                    <p>
                        어제는 타바타 운동으로 전신을 깨워주었다면,
                        오늘은 근력 운동으로 근육을 키워 대사량을 키워봐요!
                    </p>
                    <button className="action-button">바로 운동하러 가기</button>
                </div>
                <div className="image-container">
                    <img src={musimImage} alt="Musim" />
                </div>
            </div>


        </div>
    );
};

export default Home;
