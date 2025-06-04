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
  const [hoveredBannerIndex, setHoveredBannerIndex] = useState<number | null>(0);
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
      setBannerVideos([todayVideoData]);
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
            const favoriteResponse = await fetch(`${API_BASE_URL}/user/${userId}/favorites`);
            if (favoriteResponse.ok) {
                const favoriteVideoIds = await favoriteResponse.json();
                fetchedData = fetchedData.map(video => ({
                    ...video,
                    isFavorite: favoriteVideoIds.includes(video.id)
                }));
            } else {
                console.error("Failed to fetch user favorites for display.");
                fetchedData = fetchedData.map(video => ({ ...video, isFavorite: false }));
            }
        } else {
            fetchedData = fetchedData.map(video => ({ ...video, isFavorite: false }));
        }
        
        if (filterFavorite) {
            fetchedData = fetchedData.filter(video => video.isFavorite);
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

  // --- Child Components / Handlers (이 부분은 동일) ---
  const UnifiedBanner = ({
    imageSrc,
    videoData,
    topText,
    middleText,
    bottomText,
    index,
    onMouseEnter,
    onMouseLeave,
  }: {
    imageSrc: string;
    videoData: Video;
    topText?: string;
    middleText?: string;
    bottomText?: string;
    index: number;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  }) => {
    const isActive = hoveredBannerIndex === index;

    const handleBannerClick = () => {
      console.log(`영상을 재생합니다: ${videoData.video_url}`);
      navigate(`/video/${videoData.id}`, {
        state: {
          video: {
            id: String(videoData.id),
            title: videoData.title,
            video: videoData.video_url,
          },
        },
      });
    };

    return (
      <div
        className={`banner-container ${isActive ? "active" : ""}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={handleBannerClick}
      >
        <img
          src={imageSrc}
          className="banner-image"
          alt={middleText || "배너 이미지"}
        />
        <div className="text-overlay">
          {isActive && <div className="toptext">{topText}</div>}
          <div className="middletext">{middleText}</div>
          <div className="bottomtext">{bottomText}</div>
        </div>
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
        <div className="banners-inner-container">
          {loadingBanner && (
            <div className="loading-message">
              오늘의 추천 영상을 불러오는 중...
            </div>
          )}
          {errorBanner && (
            <div className="error-message">Error: {errorBanner}</div>
          )}
          {!loadingBanner &&
            bannerVideos.length > 0 &&
            bannerVideos.map((banner, index) => (
              <UnifiedBanner
                key={banner.id || index}
                index={index}
                imageSrc={banner.thumbnail_url}
                videoData={banner}
                topText={banner.topText}
                middleText={banner.middleText}
                bottomText={banner.bottomText}
                onMouseEnter={() => {
                  setHoveredBannerIndex(index);
                }}
                onMouseLeave={() => {
                  setHoveredBannerIndex(null);
                }}
              />
            ))}
        </div>
      </div>

      {/* Search Section */}
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

      {/* Filter and Sort Section */}
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
                  onChange={() =>
                    setShowOnlyCorrectionVideos(!showOnlyCorrectionVideos)
                  }
                />
                자세 교정 가능한 영상만 보기
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={showOnlyFavoriteVideos}
                  onChange={() =>
                    setShowOnlyFavoriteVideos(!showOnlyFavoriteVideos)
                  }
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

      {/* Video List (Thumbnails and Info) */}
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