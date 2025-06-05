import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Exercise.css"; // Make sure your CSS path is correct
import searchimg from "../assets/search.png";

// ★ Favorite Star Icon Component (이 부분은 동일)
const StarIcon = ({ filled, onClick }: { filled: boolean; onClick: () => void }) => (
  <svg
    className={`favorite-star-icon ${filled ? "filled" : ""}`}
    onClick={(e) => {
      e.stopPropagation(); // Prevent video card click event from firing
      onClick();
    }}
    viewBox="0 0 24 24"
    fill={filled ? "#FFD700" : "currentColor"} // Yellow if filled, default color otherwise
    stroke={filled ? "#FFD700" : "currentColor"} // Border color matches fill
    strokeWidth="1"
    width="24"
    height="24"
    style={{ cursor: "pointer", position: "absolute", top: '8px', right: '8px', zIndex: 10, color: '#e0e0e0' }}
  >
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63L2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const API_BASE_URL = "http://127.0.0.1:5000";

// --- Interfaces (이 부분은 동일) ---
interface Video {
  id: number;
  views: number;
  recommendations: number;
  upload_date: string;
  title: string;
  video_url: string;
  correctable: number;
  isFavorite?: boolean; // Indicates if this video is a favorite for the current user
  thumbnail_url: string;
  description: string;
  product_link: string | null;
}

interface TodayVideo extends Video {
  topText?: string;
  middleText?: string;
  bottomText?: string;
}

// --- Exercise Component ---
const Exercise = () => {
  const [sortType, setSortType] = useState<"recent" | "like" | "watch">("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [showOnlyCorrectionVideos, setShowOnlyCorrectionVideos] = useState(false);
  const [showOnlyFavoriteVideos, setShowOnlyFavoriteVideos] = useState(false);

  const [bannerVideos, setBannerVideos] = useState<TodayVideo[]>([]);
  const [videosToDisplay, setVideosToDisplay] = useState<Video[]>([]);
  const [loadingBanner, setLoadingBanner] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [errorVideos, setErrorVideos] = useState<string | null>(null);

  const filterButtonRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  // --- 슬라이드 관련 상태 ---
  // currentCentralIndex: 슬라이드의 중앙에 올 실제 bannerVideos 배열의 인덱스
  // 백엔드에서 1개만 주므로, bannerVideos는 항상 1개이거나 0개
  // 따라서 0 (실제 영상) 또는 -1 (빈 영상) 같은 인덱스를 사용
  // 여기서는 0이면 실제 영상, 1 또는 2면 빈 영상으로 가정
  const [centralBannerIndex, setCentralBannerIndex] = useState(0); // 0: 실제 영상, 1, 2: 빈 박스
  const slideIntervalRef = useRef<number | null>(null);


  // --- Data Fetching Functions (이 부분은 동일) ---
  const fetchTodayVideos = useCallback(async () => {
    setLoadingBanner(true);
    setErrorBanner(null);
    try {
      const response = await fetch(`${API_BASE_URL}/video/today`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Video = await response.json();

      const todayVideoData: TodayVideo = {
        ...data,
        topText: "오늘의 추천 운동",
        middleText: data.title,
        bottomText: `조회수: ${data.views}회 | 추천수: ${data.recommendations}회`,
      };
      setBannerVideos([todayVideoData]); // 여전히 하나의 영상만 저장
    } catch (err: any) {
      console.error("Failed to fetch today's videos:", err);
      setErrorBanner(
        err.message || "오늘의 추천 영상 로드 실패"
      );
      setBannerVideos([]);
    } finally {
      setLoadingBanner(false);
    }
  }, []);

  const fetchVideos = useCallback(
    async (
      filterCorrection: boolean,
      filterFavorite: boolean,
      currentSortType: "recent" | "like" | "watch",
      currentSearchQuery: string
    ) => {
      setLoadingVideos(true);
      setErrorVideos(null);
      try {
        let url = `${API_BASE_URL}/video/list`;
        let method: "GET" | "POST" = "GET";
        let body: any = null;

        const userId = localStorage.getItem("user_id");

        if (!userId && filterFavorite) {
          setErrorVideos("즐겨찾기 영상을 불러오려면 로그인이 필요합니다.");
          setVideosToDisplay([]);
          setLoadingVideos(false);
          return;
        }

        if (filterCorrection) {
          url = `${API_BASE_URL}/video/correctable`;
        } else if (filterFavorite) {
          url = `${API_BASE_URL}/video/favorite`;
          method = "POST";
          body = { id: userId };
        } else if (currentSearchQuery.trim() !== "") {
          url = `${API_BASE_URL}/video/search`;
          method = "POST";
          body = { keyword: currentSearchQuery };
        } else if (currentSortType !== "recent") {
          url = `${API_BASE_URL}/video/sort`;
          method = "POST";
          body = { keyword: currentSortType };
        }

        const response = await fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        let fetchedData: Video[] = await response.json();

        // 사용자 로그인 상태 및 즐겨찾기 여부에 따라 isFavorite 플래그 설정
        if (userId) {
    const favoriteResponse = await fetch(`${API_BASE_URL}/video/favorite`, {
        method: "POST", // 백엔드가 POST를 기대하므로 POST로 변경
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId }), // 백엔드가 'id' 키를 기대하므로 이렇게 전달
    });
    if (favoriteResponse.ok) {
        const favoriteVideos: Video[] = await favoriteResponse.json();
        const favoriteVideoIds = new Set(favoriteVideos.map(video => video.id));

        fetchedData = fetchedData.map(video => ({
            ...video,
            isFavorite: favoriteVideoIds.has(video.id)
        }));
    } else {
        console.error("Failed to fetch user favorites for display:", favoriteResponse.status);
        fetchedData = fetchedData.map(video => ({ ...video, isFavorite: false }));
    }
} else {
    fetchedData = fetchedData.map(video => ({ ...video, isFavorite: false }));
}
        
        let sortedData = [...fetchedData];
        if (currentSortType === "recent") {
          sortedData.sort(
            (a, b) =>
              new Date(b.upload_date).getTime() -
              new Date(a.upload_date).getTime()
          );
        } else if (currentSortType === "like") {
          sortedData.sort((a, b) => b.recommendations - a.recommendations);
        } else if (currentSortType === "watch") {
          sortedData.sort((a, b) => b.views - a.views);
        }

        setVideosToDisplay(sortedData);
      } catch (err: any) {
        console.error("Failed to fetch videos:", err);
        setErrorVideos(
          err.message || "영상 목록 로드 실패"
        );
        setVideosToDisplay([]);
      } finally {
        setLoadingVideos(false);
      }
    },
    []
  );

  const toggleFavorite = useCallback(async (videoId: number) => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/video/${videoId}/favorite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        throw new Error("즐겨찾기 상태 변경 실패");
      }
      const data = await response.json();
      const isFavorited = data.is_favorited;

      setVideosToDisplay(prevVideos => {
        const updatedVideos = prevVideos.map(video =>
          video.id === videoId ? { ...video, isFavorite: isFavorited } : video
        );
        
        if (showOnlyFavoriteVideos && !isFavorited) {
            return updatedVideos.filter(video => video.id !== videoId);
        }
        return updatedVideos;
      });

      alert(
        isFavorited ? "즐겨찾기 등록했습니다!" : "즐겨찾기를 해제했습니다!"
      );

    } catch (err) {
      console.error("즐겨찾기 토글 실패:", err);
      alert("즐겨찾기 상태 변경 중 오류가 발생했습니다.");
    }
  }, [showOnlyFavoriteVideos]);

  // --- Effects (이 부분은 동일) ---
  useEffect(() => {
    fetchTodayVideos();
  }, [fetchTodayVideos]);

  useEffect(() => {
    fetchVideos(
      showOnlyCorrectionVideos,
      showOnlyFavoriteVideos,
      sortType,
      searchQuery
    );
  }, [
    showOnlyCorrectionVideos,
    showOnlyFavoriteVideos,
    sortType,
    searchQuery,
    fetchVideos,
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node) &&
        showFilterOptions
      ) {
        setShowFilterOptions(false);
      }
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        // Dropdown open state is not managed, so no action needed here.
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterOptions]);

  // --- 슬라이드 기능 로직 ---
  const totalSlides = 3; // 3개의 배너 박스
  const resetInterval = useCallback(() => {
    if (slideIntervalRef.current) {
      clearInterval(slideIntervalRef.current);
    }
    slideIntervalRef.current = window.setInterval(() => {
      setCentralBannerIndex((prevIndex) => (prevIndex + 1) % totalSlides);
    }, 7000);
  }, []);

  useEffect(() => {
    resetInterval();
    return () => {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }
    };
  }, [resetInterval]);

  const handlePrevSlide = () => {
    resetInterval(); // 수동 조작 시 타이머 리셋
    setCentralBannerIndex((prevIndex) => (prevIndex - 1 + totalSlides) % totalSlides);
  };

  const handleNextSlide = () => {
    resetInterval(); // 수동 조작 시 타이머 리셋
    setCentralBannerIndex((prevIndex) => (prevIndex + 1) % totalSlides);
  };

  // 렌더링될 3개의 배너 데이터를 계산합니다.
  const displayedBanners = useMemo(() => {
    // 백엔드에서 주는 데이터는 1개만 있다고 가정
    const actualVideo = bannerVideos.length > 0 ? bannerVideos[0] : null;

    // 빈 플레이스홀더 배너 데이터
    const emptyBanner: TodayVideo = {
      id: -1, // 고유한 ID (더미)
      views: 0,
      recommendations: 0,
      upload_date: new Date().toISOString(),
      title: "준비중입니다.",
      video_url: "",
      correctable: 0,
      thumbnail_url: "placeholder_image_url.png", // 실제 사용하지 않지만, 타입 일치를 위해
      description: "새로운 영상이 곧 업데이트됩니다.",
      product_link: null,
      topText: "다음 추천 운동",
      middleText: "준비중입니다.",
      bottomText: "",
    };

    // 실제 영상, 빈 영상1, 빈 영상2 순으로 배열을 구성
    // 이 배열을 `centralBannerIndex`에 따라 재정렬하여 슬라이드 효과를 만듭니다.
    const allPossibleBanners: (TodayVideo | null)[] = [
      actualVideo, 
      { ...emptyBanner, id: -2, topText: "다음 운동 1" }, // 고유 ID 부여
      { ...emptyBanner, id: -3, topText: "다음 운동 2" } // 고유 ID 부여
    ];

    // centralBannerIndex에 따라 3개의 배너를 순환시킵니다.
    // 예: centralBannerIndex = 0 (실제 영상) -> [empty2, actual, empty1]
    // 예: centralBannerIndex = 1 (빈 영상1) -> [actual, empty1, empty2]
    // 예: centralBannerIndex = 2 (빈 영상2) -> [empty1, empty2, actual]
    const displayed = [];
    displayed[1] = allPossibleBanners[centralBannerIndex]; // 중앙
    displayed[0] = allPossibleBanners[(centralBannerIndex - 1 + totalSlides) % totalSlides]; // 왼쪽
    displayed[2] = allPossibleBanners[(centralBannerIndex + 1) % totalSlides]; // 오른쪽

    return displayed;
  }, [bannerVideos, centralBannerIndex]);


  // --- Memoized Values (이 부분은 동일) ---
  const autocompleteSuggestions = useMemo(() => {
    if (searchQuery.trim() === "") return [];
    const lowerCaseQuery = searchQuery.toLowerCase();
    const suggestions = new Set<string>();
    videosToDisplay.forEach((video) => {
      if (video.title.toLowerCase().includes(lowerCaseQuery)) {
        suggestions.add(video.title);
      }
    });
    return Array.from(suggestions).slice(0, 5);
  }, [videosToDisplay, searchQuery]);

  // --- Child Components / Handlers ---
  const UnifiedBanner = ({
    imageSrc,
    videoData,
    topText,
    middleText,
    bottomText,
    isCentral, // 중앙 배너인지 나타내는 prop 추가
  }: {
    imageSrc?: string;
    videoData?: Video;
    topText?: string;
    middleText?: string;
    bottomText?: string;
    isCentral: boolean; // 새로운 prop
  }) => {
    const handleBannerClick = () => {
      if (videoData && videoData.id !== -1 && videoData.id !== -2 && videoData.id !== -3) { // 더미 ID가 아닐 때만 이동
        console.log(`영상을 재생합니다: ${videoData.video_url}`);
        navigate(`/video/${videoData.id}`, {
          state: {
            video: {
              id: String(videoData.id),
              title: videoData.title,
              video: videoData.video_url.startsWith("http")
                ? videoData.video_url
                : `${API_BASE_URL}/${videoData.video_url}`, // Path correction
            },
          },
        });
      }
    };

    return (
      <div
        className={`banner-container ${!videoData || videoData.id < 0 ? "empty" : ""} ${isCentral ? "central" : "side"}`}
        onClick={handleBannerClick}
        style={{ cursor: (videoData && videoData.id >= 0) ? "pointer" : "default" }}
      >
        {videoData && videoData.id >= 0 ? ( // 실제 데이터가 있을 때만 이미지와 텍스트 오버레이 렌더링
          <>
            <img
              src={imageSrc}
              className="banner-image"
              alt={middleText || "배너 이미지"}
            />
            <div className="text-overlay">
              {isCentral && <div className="toptext">{topText}</div>} {/* 중앙일 때만 topText 표시 */}
              <div className="middletext">{middleText}</div>
              <div className="bottomtext">{bottomText}</div>
            </div>
          </>
        ) : ( // 빈 박스 내용 렌더링
          <div className="empty-banner-content">
            <p>{middleText}</p>
          </div>
        )}
      </div>
    );
  };

  const handleVideoCardClick = (video: Video) => {
    navigate(`/video/${video.id}`, {
      state: {
        video: {
          id: String(video.id),
          title: video.title,
          video: video.video_url.startsWith("http")
            ? video.video_url
            : `${API_BASE_URL}/${video.video_url}`, // Path correction
        },
      },
    });
  };

  // --- Render ---
  return (
    <div className="ex-container">
      {/* Banner Section */}
      <div className="overlapping-banners-wrapper">
        {loadingBanner && (
          <div className="loading-message">
            오늘의 추천 영상을 불러오는 중...
          </div>
        )}
        {errorBanner && (
          <div className="error-message">Error: {errorBanner}</div>
        )}
        {!loadingBanner && (
          <div className="banners-carousel-container">
            <div
              className="banners-inner-wrapper"
              // centralBannerIndex에 따라 translateX 값을 설정
              style={{ transform: `translateX(-${centralBannerIndex * (100 / 3)}%)` }} // 33.33%씩 이동
            >
              {displayedBanners.map((banner, i) => (
                <UnifiedBanner
                  key={banner?.id || `empty-${i}`} // 유니크한 key를 부여
                  imageSrc={banner?.thumbnail_url}
                  videoData={banner || undefined} // null일 경우 undefined로 넘겨 타입 오류 방지
                  topText={banner?.topText}
                  middleText={banner?.middleText || "준비중입니다."}
                  bottomText={banner?.bottomText}
                  isCentral={i === 1} // 3개 중 가운데(인덱스 1)가 중앙
                />
              ))}
            </div>
            {/* 이전 버튼 */}
            <button className="carousel-arrow left-arrow" onClick={handlePrevSlide}>
              &#9664; {/* 왼쪽 화살표 문자 */}
            </button>
            {/* 다음 버튼 */}
            <button className="carousel-arrow right-arrow" onClick={handleNextSlide}>
              &#9654; {/* 오른쪽 화살표 문자 */}
            </button>
          </div>
        )}
      </div>

      {/* Search Section (동일) */}
      <div className="search-section">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowAutocomplete(true)}
            onBlur={() => setTimeout(() => setShowAutocomplete(false), 100)}
            className="search-input-styled"
          />
          {searchQuery.length > 0 ? (
            <span
              className="search-icon clear-icon"
              onClick={() => setSearchQuery("")}
            >
              ×
            </span>
          ) : (
            <span className="search-icon">
              <img
                src={searchimg}
                className="search-image-icon"
                alt="Search Icon"
              />
            </span>
          )}
        </div>
        {showAutocomplete && autocompleteSuggestions.length > 0 && (
          <div className="autocomplete-suggestions">
            {autocompleteSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="suggestion-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSearchQuery(suggestion);
                  setShowAutocomplete(false);
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter and Sort Section (동일) */}
      <div className="filter-sort-section">
        <div className="filter-button-wrapper" ref={filterButtonRef}>
          <button
            className="filter-button"
            onClick={() => setShowFilterOptions(!showFilterOptions)}
          >
            <span className="filter-icon">
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="currentColor"
              >
                <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
              </svg>
            </span>
          </button>
          {showFilterOptions && (
            <div className="filter-options-dropdown">
              <label>
                <input
                  type="checkbox"
                  checked={showOnlyCorrectionVideos}
                  onChange={() => {
                    setShowOnlyCorrectionVideos(!showOnlyCorrectionVideos); // 현재 상태 토글
                    setShowOnlyFavoriteVideos(false); // 즐겨찾기는 항상 해제
                  }}
                />
                자세 교정 가능한 영상만 보기
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={showOnlyFavoriteVideos}
                  onChange={() => {
                    setShowOnlyFavoriteVideos(!showOnlyFavoriteVideos); // 현재 상태 토글
                    setShowOnlyCorrectionVideos(false); // 자세 교정은 항상 해제
                  }}
                />
                즐겨 찾기한 영상만 보기
              </label>
            </div>
          )}
        </div>

        <div className="sort-dropdown-wrapper" ref={sortDropdownRef}>
          <select
            className="sort-dropdown"
            value={sortType}
            onChange={(e) =>
              setSortType(e.target.value as "recent" | "like" | "watch")
            }
          >
            <option value="recent">최신순</option>
            <option value="like">추천순</option>
            <option value="watch">조회순</option>
          </select>
          <span className="dropdown-arrow"></span>
        </div>
      </div>

      {/* Video List (동일) */}
      <div className="video-list">
        {loadingVideos && (
          <div className="loading-message">
            운동 영상 데이터를 불러오는 중...
          </div>
        )}
        {errorVideos && (
          <div
            className="error-message"
            style={{ color: "red", textAlign: "center", padding: "20px" }}
          >
            데이터 로드 중 오류가 발생했습니다: {errorVideos}
          </div>
        )}

        {!loadingVideos && videosToDisplay.length > 0 ? (
          videosToDisplay.map((video) => (
            <div
              key={video.id}
              className="video-card"
              onClick={() => handleVideoCardClick(video)}
            >
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="video-thumbnail"
              />
              {/* ★ 즐겨찾기 별 버튼 추가 */}
              <StarIcon
                filled={video.isFavorite || false}
                onClick={(e) => {
                  e.stopPropagation(); // Stop propagation to prevent video card click
                  toggleFavorite(video.id);
                }}
              />
              <div className="video-details">
                <div className="video-title">{video.title}</div>
                <div className="video-meta">
                  <span>조회수: {video.views}</span>
                  <span>추천: {video.recommendations}</span>
                  <span>
                    날짜: {new Date(video.upload_date).toLocaleDateString()}
                  </span>
                  {video.correctable === 1 && (
                    <span className="correction-tag">자세 교정</span>
                  )}
                  {/* ★ 즐겨찾기 태그 추가 */}
                  {video.isFavorite && (
                    <span className="favorite-tag">즐겨찾기</span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          !loadingVideos &&
          !errorVideos && (
            <div className="no-videos-message">
              검색 결과가 없거나 영상을 불러올 수 없습니다.
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Exercise;