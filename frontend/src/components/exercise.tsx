import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Exercise.css"; // Make sure your CSS path is correct
import searchimg from "../assets/search.png";

// ★ Favorite Star Icon Component (이 부분은 동일)
const StarIcon = ({
  filled,
  onClick,
}: {
  filled: boolean;
  onClick: (event: React.MouseEvent<SVGElement>) => void; // Change here
}) => (
  <svg
    className={`favorite-star-icon ${filled ? "filled" : ""}`}
    onClick={(e) => {
      e.stopPropagation(); // Prevent video card click event from firing
      onClick(e); // Pass the event object to onClick
    }}
    viewBox="0 0 24 24"
    fill={filled ? "#FFD700" : "currentColor"} // Yellow if filled, default color otherwise
    stroke={filled ? "#FFD700" : "currentColor"} // Border color matches fill
    strokeWidth="1"
    width="24"
    height="24"
    style={{
      cursor: "pointer",
      position: "absolute",
      top: "8px",
      right: "8px",
      zIndex: 10,
      color: "#e0e0e0",
    }}
  >
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63L2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);

const API_BASE_URL = "https://web-production-6e732.up.railway.app";

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
  const [sortType, setSortType] = useState<"recent" | "like" | "watch">(
    "recent"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [showOnlyCorrectionVideos, setShowOnlyCorrectionVideos] =
    useState(false);
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
  // totalSlides: 백엔드에서 받아올 실제 추천 영상의 개수 (3개)
  const totalSlides = 3;
  // displayedBanners 배열의 총 길이 (실제 3개 + 양쪽 클론 2개 = 5개)
  const carouselLength = totalSlides + 2;

  // centralBannerIndex: 렌더링에 사용될 expandedBanners 배열 내의 현재 중앙 요소 인덱스
  // 초기값은 실제 첫 번째 비디오 (expandedBanners의 인덱스 1)
  const [centralBannerIndex, setCentralBannerIndex] = useState(1);
  const slideIntervalRef = useRef<number | null>(null);
  const isAnimating = useRef(false); // 애니메이션 중복 실행 방지 플래그

  // --- Data Fetching Functions ---
  const fetchTodayVideos = useCallback(async () => {
    setLoadingBanner(true);
    setErrorBanner(null);
    try {
      const response = await fetch(`${API_BASE_URL}/video/today`);
      if (!response.ok) {
        if (response.status === 404) {
          setErrorBanner("추천 운동 영상이 없습니다.");
          setBannerVideos([]);
          setLoadingBanner(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const videosData: Video[] = await response.json();

      if (videosData.length === 0) {
        setErrorBanner("추천 운동 영상이 없습니다.");
        setBannerVideos([]);
      } else {
        // 백엔드에서 받은 비디오 데이터에 topText, middleText, bottomText 추가
        const formattedVideos: TodayVideo[] = videosData.map((video, index) => {
          let topText = "";
          if (index === 0) {
            topText = "오늘의 추천 운동 1";
          } else if (index === 1) {
            topText = "오늘의 추천 운동 2"; // 두 번째 비디오에 대한 텍스트
          } else if (index === 2) {
            topText = "오늘의 추천 운동 3"; // 세 번째 비디오에 대한 텍스트
          }

          return {
            ...video,
            topText: topText,
            middleText: video.title,
            bottomText: `조회수: ${video.views}회 | 추천수: ${video.recommendations}회`,
          };
        });

        setBannerVideos(formattedVideos);
        // 중앙 배너 인덱스를 실제 첫 번째 영상의 인덱스로 설정 (expandedBanners 기준)
        setCentralBannerIndex(1); // expandedBanners에서 첫 번째 실제 영상의 위치
      }
    } catch (err: any) {
      console.error("Failed to fetch today's videos:", err);
      setErrorBanner(err.message || "오늘의 추천 영상 로드 실패");
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

        if (userId) {
          const favoriteResponse = await fetch(
            `${API_BASE_URL}/video/favorite`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: userId }),
            }
          );
          if (favoriteResponse.ok) {
            const favoriteVideos: Video[] = await favoriteResponse.json();
            const favoriteVideoIds = new Set(
              favoriteVideos.map((video) => video.id)
            );

            fetchedData = fetchedData.map((video) => ({
              ...video,
              isFavorite: favoriteVideoIds.has(video.id),
            }));
          } else {
            console.error(
              "Failed to fetch user favorites for display:",
              favoriteResponse.status
            );
            fetchedData = fetchedData.map((video) => ({
              ...video,
              isFavorite: false,
            }));
          }
        } else {
          fetchedData = fetchedData.map((video) => ({
            ...video,
            isFavorite: false,
          }));
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
        setErrorVideos(err.message || "영상 목록 로드 실패");
        setVideosToDisplay([]);
      } finally {
        setLoadingVideos(false);
      }
    },
    []
  );

  const toggleFavorite = useCallback(
    async (videoId: number) => {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        alert("로그인이 필요합니다.");
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/video/${videoId}/favorite`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId }),
          }
        );

        if (!response.ok) {
          throw new Error("즐겨찾기 상태 변경 실패");
        }
        const data = await response.json();
        const isFavorited = data.is_favorited;

        setVideosToDisplay((prevVideos) => {
          const updatedVideos = prevVideos.map((video) =>
            video.id === videoId ? { ...video, isFavorite: isFavorited } : video
          );

          if (showOnlyFavoriteVideos && !isFavorited) {
            return updatedVideos.filter((video) => video.id !== videoId);
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
    },
    [showOnlyFavoriteVideos]
  );

  // --- Effects ---
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

  // 자동 슬라이드 타이머 관리
  const resetInterval = useCallback(() => {
    if (slideIntervalRef.current) {
      clearInterval(slideIntervalRef.current);
    }
    slideIntervalRef.current = window.setInterval(() => {
      // 다음 슬라이드로 이동 (애니메이션 포함)
      if (!isAnimating.current) {
        // 애니메이션 중이 아닐 때만 이동
        setCentralBannerIndex((prevIndex) => prevIndex + 1);
        isAnimating.current = true; // 애니메이션 시작 플래그
      }
    }, 7000);
  }, []);

  useEffect(() => {
    // bannerVideos 데이터가 로드될 때만 인터벌 시작
    if (bannerVideos.length > 0) {
      resetInterval();
    }
    return () => {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }
    };
  }, [bannerVideos, resetInterval]);

  // `displayedBanners`는 무한 루프를 위해 클론된 배열을 생성합니다.
  const displayedBanners = useMemo(() => {
    if (bannerVideos.length === 0) {
      // 비디오가 없을 경우 빈 플레이스홀더 3개를 만듭니다.
      const emptyBanner: TodayVideo = {
        id: -1,
        views: 0,
        recommendations: 0,
        upload_date: new Date().toISOString(),
        title: "준비중입니다.",
        video_url: "",
        correctable: 0,
        thumbnail_url: "placeholder_image_url.png",
        description: "새로운 영상이 곧 업데이트됩니다.",
        product_link: null,
        topText: "다음 추천 운동",
        middleText: "준비중입니다.",
        bottomText: "",
      };
      // 5개 (양쪽 클론 포함)의 빈 배너를 생성
      return Array.from({ length: carouselLength }).map((_, i) => ({
        ...emptyBanner,
        id: -(i + 1), // 고유한 더미 ID 부여
        topText: `다음 추천 운동 ${i > 0 && i < carouselLength - 1 ? i : ""}`,
        middleText: "준비중입니다.",
      }));
    }

    // 실제 비디오가 3개일 경우 (백엔드에서 3개만 온다고 가정)
    // [마지막 영상, 실제 첫 영상, 실제 두 번째 영상, 실제 세 번째 영상, 첫 번째 영상]
    // 이렇게 구성하여 무한 루프 시뮬레이션을 위한 클론을 생성합니다.
    const firstClone = { ...bannerVideos[bannerVideos.length - 1], id: -999 }; // 마지막 영상 클론
    const lastClone = { ...bannerVideos[0], id: -998 }; // 첫 영상 클론

    const expanded = [firstClone, ...bannerVideos, lastClone];
    return expanded;
  }, [bannerVideos, carouselLength]);

  // 슬라이드 애니메이션 완료 시점 처리 (클론 <-> 실제 위치 점프)
  const handleTransitionEnd = useCallback(() => {
    if (isAnimating.current) {
      // 애니메이션이 끝났을 때만 처리
      let nextIndex = centralBannerIndex;
      let shouldJump = false;

      // 마지막 클론에 도달했을 때 (실제 첫 번째 비디오로 점프)
      if (centralBannerIndex === carouselLength - 1) {
        nextIndex = 1; // 실제 첫 번째 비디오의 인덱스
        shouldJump = true;
      }
      // 첫 번째 클론에 도달했을 때 (실제 마지막 비디오로 점프)
      else if (centralBannerIndex === 0) {
        nextIndex = totalSlides; // 실제 마지막 비디오의 인덱스
        shouldJump = true;
      }

      if (shouldJump) {
        // transition을 끄고 위치를 즉시 변경
        const innerWrapper = document.querySelector(
          ".banners-inner-wrapper"
        ) as HTMLElement;
        if (innerWrapper) {
          innerWrapper.style.transition = "none";
          setCentralBannerIndex(nextIndex);
          // DOM이 업데이트될 시간을 준 후 다시 transition을 켜기
          requestAnimationFrame(() => {
            if (innerWrapper) {
              // 다시 확인
              innerWrapper.style.transition = ""; // 기본 transition으로 복원
            }
          });
        }
      }
      isAnimating.current = false; // 애니메이션 종료 플래그
    }
  }, [centralBannerIndex, carouselLength, totalSlides]);

  // 이전 버튼 클릭 핸들러
  const handlePrevSlide = () => {
    resetInterval(); // 수동 조작 시 타이머 리셋
    if (!isAnimating.current) {
      setCentralBannerIndex((prevIndex) => prevIndex - 1);
      isAnimating.current = true;
    }
  };

  // 다음 버튼 클릭 핸들러
  const handleNextSlide = () => {
    resetInterval(); // 수동 조작 시 타이머 리셋
    if (!isAnimating.current) {
      setCentralBannerIndex((prevIndex) => prevIndex + 1);
      isAnimating.current = true;
    }
  };

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
    isCentral,
  }: {
    imageSrc?: string;
    videoData?: Video;
    topText?: string;
    middleText?: string;
    bottomText?: string;
    isCentral: boolean;
  }) => {
    const handleBannerClick = () => {
      if (
        videoData &&
        videoData.id > 0 // 더미 ID가 아닐 때만 이동 (id < 0 이면 더미)
      ) {
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
        className={`banner-container ${!videoData || videoData.id < 0 ? "empty" : ""
          } ${isCentral ? "central" : "side"}`}
        onClick={handleBannerClick}
        style={{
          cursor: videoData && videoData.id > 0 ? "pointer" : "default",
        }}
      >
        {videoData && videoData.id > 0 ? ( // 실제 데이터가 있을 때만 이미지와 텍스트 오버레이 렌더링
          <>
            <img
              src={imageSrc}
              className="banner-image"
              alt={middleText || "배너 이미지"}
            />
            <div className="text-overlay">
              {isCentral && <div className="toptext">{topText}</div>}{" "}
              {/* 중앙일 때만 topText 표시 */}
              <div className="middletext">{middleText}</div>
              <div className="bottomtext">{bottomText}</div>
            </div>
          </>
        ) : (
          // 빈 박스 내용 렌더링
          <div className="empty-banner-content">
            <p>{middleText}</p>
          </div>
        )}
      </div>
    );
  };

  const handleVideoCardClick = async (video: Video) => {
    try {
      await fetch(
        `https://web-production-6e732.up.railway.app/video/${video.id}/view`,
        {
          method: "POST",
        }
      );
    } catch (error) {
      console.error("조회수 증가 실패:", error);
    }

    navigate(`/video/${video.id}`, {
      state: {
        video: {
          id: String(video.id),
          title: video.title,
          video: video.video_url.startsWith("http")
            ? video.video_url
            : `${API_BASE_URL}/${video.video_url}`,
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
              // `carouselLength`에 기반하여 전체 너비 중 각 슬라이드의 비율을 계산합니다.
              // `transition` 속성은 CSS에서 정의하여 애니메이션을 적용합니다.
              style={{
                transform: `translateX(-${centralBannerIndex * (100 / carouselLength)
                  }%)`,
                transition: isAnimating.current
                  ? "transform 0.5s ease-in-out"
                  : "none", // 애니메이션 중일 때만 transition 적용
              }}
              onTransitionEnd={handleTransitionEnd} // 애니메이션 종료 이벤트 리스너 추가
            >
              {displayedBanners.map((banner, i) => (
                <UnifiedBanner
                  key={banner?.id !== undefined ? banner.id : `empty-${i}`} // 유니크한 key를 부여, 더미 ID 고려
                  imageSrc={banner?.thumbnail_url}
                  videoData={banner || undefined}
                  topText={banner?.topText}
                  middleText={banner?.middleText || "준비중입니다."}
                  bottomText={banner?.bottomText}
                  isCentral={i === centralBannerIndex} // 현재 중앙 배너인지 확인
                />
              ))}
            </div>
            {/* 이전 버튼 */}
            <button
              className="carousel-arrow left-arrow"
              onClick={handlePrevSlide}
            >
              &#9664; {/* 왼쪽 화살표 문자 */}
            </button>
            {/* 다음 버튼 */}
            <button
              className="carousel-arrow right-arrow"
              onClick={handleNextSlide}
            >
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
        ) : !loadingVideos && !errorVideos ? (
          <div className="no-videos-message">
            검색 결과가 없거나 영상을 불러올 수 없습니다.
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Exercise;
