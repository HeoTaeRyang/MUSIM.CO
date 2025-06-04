import "../styles/Exercise.css";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import searchimg from "../assets/search.png";

// ★ 즐겨찾기 아이콘 (별 모양 SVG)
const StarIcon = ({ filled, onClick }: { filled: boolean; onClick: () => void }) => (
  <svg
    className={`favorite-star-icon ${filled ? "filled" : ""}`}
    onClick={(e) => {
      e.stopPropagation(); // 비디오 카드 클릭 이벤트 전파 방지
      onClick();
    }}
    viewBox="0 0 24 24"
    fill={filled ? "#FFD700" : "currentColor"} // 채워진 별은 노란색, 아니면 기본 색
    stroke={filled ? "#FFD700" : "currentColor"} // 테두리도 일치
    strokeWidth="1"
    width="24"
    height="24"
    style={{ cursor: "pointer", position: "absolute", top: '8px', right: '8px', zIndex: 10, color: '#e0e0e0' }} // 스타일 추가
  >
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63L2 9.24l5.46 4.73L5.82 21z" />
  </svg>
);


const API_BASE_URL = "http://127.0.0.1:5000";

interface Video {
  id: number;
  views: number;
  recommendations: number;
  upload_date: string;
  title: string;
  video_url: string;
  correctable: number;
  isFavorite?: boolean; // 이 비디오가 현재 사용자의 즐겨찾기인지 여부
  thumbnail_url: string;
  description: string;
  product_link: string | null;
}

interface TodayVideo extends Video {
  topText?: string;
  middleText?: string;
  bottomText?: string;
}

const Exercise = () => {
  const [sortType, setSortType] = useState<"recent" | "like" | "watch">(
    "recent"
  );
  const [searchQuery, setSearchQuery] = useState("");
  // Removed: lastActiveBannerIndex, only rely on hoveredBannerIndex for visual feedback
  const [hoveredBannerIndex, setHoveredBannerIndex] = useState<number | null>(
    0 // Default to first banner active
  );
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // Removed all dragging related states:
  // const [isDragging, setIsDragging] = useState(false);
  // const [startX, setStartX] = useState(0);
  // const [currentTranslateX, setCurrentTranslateX] = useState(0);
  // const [draggedDistance, setDraggedDistance] = useState(0);

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

  const overlappingBannersWrapperRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  const fetchTodayVideos = useCallback(async () => {
    setLoadingBanner(true);
    setErrorBanner(null);
    try {
      const response = await axios.get<Video>(`${API_BASE_URL}/video/today`);
      const data: Video = response.data;

      const todayVideoData: TodayVideo = {
        ...data,
        topText: "오늘의 추천 운동",
        middleText: data.title,
        bottomText: `조회수: ${data.views}회 | 추천수: ${data.recommendations}회`,
      };
      setBannerVideos([todayVideoData]);
    } catch (err) {
      console.error("Failed to fetch today's videos:", err);
      setErrorBanner(
        axios.isAxiosError(err)
          ? err.response?.data?.error || "오늘의 추천 영상 로드 실패"
          : "알 수 없는 오류 발생"
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
        console.log("현재 localStorage의 userId (fetchVideos):", userId);

        if (!userId && filterFavorite) {
          setErrorVideos("즐겨찾기 영상을 불러오려면 로그인이 필요합니다.");
          setVideosToDisplay([]);
          setLoadingVideos(false);
          return; 
        }

        if (filterCorrection) {
          url = `${API_BASE_URL}/video/correctable`;
        } else if (filterFavorite) {
          // ★ 백엔드 /video/favorite 엔드포인트에 맞춰 URL 및 바디 수정
          url = `${API_BASE_URL}/video/favorite`; 
          method = "POST";
          body = { id: userId }; // 백엔드 video_favorite 함수가 'id' 키로 user_id를 기대함
        } else if (currentSearchQuery.trim() !== "") {
          url = `${API_BASE_URL}/video/search`;
          method = "POST";
          body = { keyword: currentSearchQuery };
        } else if (currentSortType !== "recent") {
          url = `${API_BASE_URL}/video/sort`;
          method = "POST";
          body = { keyword: currentSortType };
        }

        const response = await axios({ url, method, data: body });
        let fetchedData: Video[] = response.data; 

        // 각 영상에 isFavorite 상태 주입
        // (현재 백엔드 get_favorite_videos는 즐겨찾기된 영상만 주므로,
        // filterFavorite가 true일 때는 모든 영상이 isFavorite: true 임)
        if (filterFavorite) {
            fetchedData = fetchedData.map(video => ({
                ...video,
                isFavorite: true // 즐겨찾기 필터 시 모든 영상은 즐겨찾기 상태
            }));
        } else {
            // 그 외의 경우 (일반 목록, 검색, 정렬)는 isFavorite를 false로 초기화합니다.
            // 이상적으로는 백엔드가 이 정보를 함께 제공해야 합니다.
            // 여기서는 사용자가 직접 토글할 때만 isFavorite 상태가 업데이트됩니다.
            fetchedData = fetchedData.map(video => ({
                ...video,
                isFavorite: false 
            }));
        }


        let sortedData = [...fetchedData]; // isFavorite 상태가 주입된 데이터로 정렬
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
      } catch (err) {
        console.error("Failed to fetch videos:", err);
        setErrorVideos(
          axios.isAxiosError(err)
            ? err.response?.data?.error || "영상 목록 로드 실패"
            : "알 수 없는 오류 발생"
        );
        setVideosToDisplay([]);
      } finally {
        setLoadingVideos(false);
      }
    },
    [] 
  );

  // ★ 즐겨찾기 토글 함수
  const handleFavoriteToggle = useCallback(async (videoId: number, isCurrentlyFavorite: boolean) => {
    const userId = localStorage.getItem("user_id");
    if (!userId) {
      alert("즐겨찾기 기능을 사용하려면 로그인해주세요.");
      return;
    }

    try {
      // ★ 백엔드에 추가할 /video/toggle_favorite 엔드포인트에 맞춰 요청
      const response = await axios.post(`${API_BASE_URL}/video/toggle_favorite`, {
        user_id: parseInt(userId), // 백엔드 함수가 'user_id'로 받음
        video_id: videoId,         // 백엔드 함수가 'video_id'로 받음
      });

      console.log("Favorite toggle response:", response.data);

      // UI 업데이트: 비디오 리스트에서 해당 비디오의 isFavorite 상태를 변경
      setVideosToDisplay(prevVideos => {
        const updatedVideos = prevVideos.map(video => 
          video.id === videoId ? { ...video, isFavorite: !isCurrentlyFavorite } : video
        );
        
        // '즐겨 찾기한 영상만 보기' 필터가 켜져있고, 즐겨찾기를 해제했다면 목록에서 제거
        if (showOnlyFavoriteVideos && isCurrentlyFavorite) { 
          return updatedVideos.filter(video => video.id !== videoId);
        }
        // If "Show only favorite videos" filter is on and a video is favorited,
        // we might need to re-fetch the list to show the newly added favorite.
        // For simplicity, we'll just update the current UI state.
        // A full re-fetch here could lead to too many API calls if toggled frequently.
        // The most robust solution would be for the backend to return the full updated favorite list,
        // or for the UI to manage favorites more robustly in local state.
        return updatedVideos;
      });

    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      alert("즐겨찾기 상태 변경에 실패했습니다. 백엔드 서버를 확인해주세요.");
      // 에러 처리: 백엔드 메시지 등을 사용자에게 보여줄 수 있음
    }
  }, [showOnlyFavoriteVideos]); 


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

  // Removed: mouseDownClientX useRef

  // Removed: onMouseDown, onMouseMove, onMouseUp callbacks

  // Removed: useEffect for mousemove and mouseup listeners

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

  const UnifiedBanner = ({
    imageSrc,
    videoData,
    topText,
    middleText,
    bottomText,
    index,
    onMouseEnter,
    onMouseLeave,
    // Removed: currentDraggedDistance
  }: {
    imageSrc: string;
    videoData: Video;
    topText?: string;
    middleText?: string;
    bottomText?: string;
    index: number;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    // Removed: currentDraggedDistance: number;
  }) => {
    const isActive = hoveredBannerIndex === index; // Only rely on hover for active state

    const handleBannerClick = () => {
      // Removed: drag distance check
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
            : `${API_BASE_URL}/${video.video_url}`, // 경로 보정
        },
      },
    });
  };

  return (
    <div className="ex-container">
      {/* 배너 섹션 - 드래그 기능 제거 */}
      <div
        className="overlapping-banners-wrapper"
        ref={overlappingBannersWrapperRef}
        // Removed: onMouseDown, onMouseLeave props
      >
        <div
          className="banners-inner-container"
          // Removed: style={{ transform: `translateX(${currentTranslateX}px)` }}
        >
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
                  // Removed: setLastActiveBannerIndex(index);
                }}
                onMouseLeave={() => {
                  setHoveredBannerIndex(null);
                }}
                // Removed: currentDraggedDistance={draggedDistance}
              />
            ))}
        </div>
      </div>

      {/* 검색창 */}
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

      {/* 필터 및 정렬 섹션 */}
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

      {/* 영상 목록 (썸네일 및 정보 포함) */}
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

        {!loadingVideos && videosToDisplay.length > 0
          ? videosToDisplay.map((video) => (
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
                    onClick={() => handleFavoriteToggle(video.id, video.isFavorite || false)}
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
                  </div>
                </div>
              </div>
            ))
          : !loadingVideos &&
            !errorVideos && (
              <div className="no-videos-message">
                검색 결과가 없거나 영상을 불러올 수 없습니다.
              </div>
            )}
      </div>
    </div>
  );
};

export default Exercise;