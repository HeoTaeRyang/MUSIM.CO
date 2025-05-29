// Home.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Home.css';
import trophyImg from '../assets/trophy.png';

interface RankItem {
    rank: number;
    username: string;
    score: number;
}

const Home = () => {
    const username = localStorage.getItem('username') || '사용자';
    const userId = localStorage.getItem('user_id') || '';

    // 내 순위
    const [myRank, setMyRank] = useState<{ rank: number; score: number } | null>(null);
    // 상위 5명
    const [top5, setTop5] = useState<RankItem[]>([]);

    useEffect(() => {
        // 1) 내 포인트 순위 및 점수 조회
        axios
            .get('/points/myRank', { params: { user_id: userId } })
            .then(res => {
                const data = res.data;
                setMyRank({ rank: data.rank, score: data.score });
            })
            .catch(() => {
                setMyRank({ rank: 0, score: 0 });
            });

        // 2) 상위 5명 조회
        axios
            .get('/points/top5')
            .then(res => {
                // 여기가 핵심: res.data 가 배열인지 확인하고 state에 반영
                if (Array.isArray(res.data)) {
                    setTop5(res.data as RankItem[]);
                } else if (Array.isArray(res.data.top5)) {
                    // 혹시 { top5: [...] } 형태라면
                    setTop5(res.data.top5);
                } else {
                    console.error('예상치 못한 top5 응답:', res.data);
                    setTop5([]);
                }
            })
            .catch(() => setTop5([]));
    }, [userId]);

    return (
        <div className="dashboard">
            {/* 인삿말 */}
            <div className="greeting">
                <span className="username">{username}님!</span><br />
                오늘도 건강한 하루 보내세요:D
            </div>

            {/* 왼쪽 포인트 순위 영역 */}
            <div className="left-panel">
                {/* 나의 포인트 순위 카드 */}
                <div className="my-rank-card">
                    <img src={trophyImg} alt="트로피" className="trophy" />
                    <div className="my-rank-text">
                        <div className="title">나의 포인트 순위</div>
                        <div className="rank">{myRank ? `${myRank.rank}위` : '-위'}</div>
                        <div className="score">{myRank ? `${myRank.score}점` : '0점'}</div>
                    </div>
                </div>

                {/* 사이트 전체 포인트 순위 Top5 */}
                <div className="top-rank-card">
                    <div className="title">포인트 순위</div>
                    <ul className="rank-list">
                        {top5.map(item => (
                            <li key={item.rank}>
                                <span className="rank-number">{item.rank}위</span>
                                <span className="rank-name">{item.username}</span>
                                <span className="rank-score">{item.score}점</span>
                            </li>
                        ))}
                        {top5.length === 0 && <li>순위 정보를 불러올 수 없습니다.</li>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Home;
