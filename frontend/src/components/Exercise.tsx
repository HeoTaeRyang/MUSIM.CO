// src/pages/Exercise.tsx (혹은 src/components/Exercise.tsx)

import "../styles/Exercise.css";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import exeMainImage from "../assets/exe_main.png";
import exeMainImage2 from "../assets/exe_main2.png";
import exeMainImage3 from "../assets/exe_main3.png";
import searchimg from "../assets/search.png";

const Exercise = () => {
  const [sortType, setSortType] = useState<"recent" | "like" | "watch">("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastActiveBannerIndex, setLastActiveBannerIndex] = useState<number>(0);
  const [hoveredBannerIndex, setHoveredBannerIndex] = useState<number | null>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentTranslateX, setCurrentTranslateX] = useState(0);
  const [draggedDistance, setDraggedDistance] = useState(0);

  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [showOnlyCorrectionVideos, setShowOnlyCorrectionVideos] = useState(false);
  const [showOnlyFavoriteVideos, setShowOnlyFavoriteVideos] = useState(false);

  const overlappingBannersWrapperRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const bannerImages = useMemo(() => [
    { src: exeMainImage, videoId: "video1", topText: "오늘의 추천 영상", middleText: "집에서도", bottomText: "전신 근력 유산소" },
    { src: exeMainImage2, videoId: "video2", topText: "피로 회복 스트레칭", middleText: "바쁜 일상 속", bottomText: "틈새 스트레칭" },
    { src: exeMainImage3, videoId: "video3", topText: "코어 근육 강화", middleText: "탄탄한", bottomText: "복근 만들기" },
  ], []);

  const allVideos = useMemo(() => [
    { id: 1, views: 120, likes: 30, date: "2025-05-01", title: "하체운동 루틴", videoId: "video1", isCorrection: false, isFavorite: false },
    { id: 2, views: 80, likes: 50, date: "2025-04-30", title: "상체 스트레칭", videoId: "video2", isCorrection: true, isFavorite: false },
    { id: 3, views: 200, likes: 80, date: "2025-04-25", title: "플랭크 챌린지", videoId: "video3", isCorrection: false, isFavorite: true },
    { id: 4, views: 95, likes: 20, date: "2025-05-02", title: "팔 운동 루틴", isCorrection: false, isFavorite: false },
    { id: 5, views: 150, likes: 60, date: "2025-04-28", title: "코어 강화 운동", isCorrection: true, isFavorite: false },
    { id: 6, views: 70, likes: 25, date: "2025-05-03", title: "전신 유산소 운동", isCorrection: false, isFavorite: true },
    { id: 7, views: 110, likes: 40, date: "2025-04-29", title: "어깨 스트레칭", isCorrection: true, isFavorite: false },
    { id: 8, views: 60, likes: 15, date: "2025-05-04", title: "다리 스트레칭", isCorrection: false, isFavorite: false },
    { id: 9, views: 180, likes: 70, date: "2025-04-27", title: "복근 운동", isCorrection: true, isFavorite: true },
  ], []);

  const filteredAndSortedVideos = useMemo(() => {
    let filtered = allVideos.filter((video) =>
      video.title.includes(searchQuery)
    );

    if (showOnlyCorrectionVideos) {
      filtered = filtered.filter(video => video.isCorrection);
    }
    if (showOnlyFavoriteVideos) {
      filtered = filtered.filter(video => video.isFavorite);
    }

    if (sortType === "recent") {
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortType === "like") {
      filtered.sort((a, b) => b.likes - a.likes);
    } else if (sortType === "watch") {
      filtered.sort((a, b) => b.views - a.views);
    }
    return filtered;
  }, [allVideos, searchQuery, sortType, showOnlyCorrectionVideos, showOnlyFavoriteVideos]);

  const autocompleteSuggestions = useMemo(() => {
    if (searchQuery.trim() === "") return [];
    const lowerCaseQuery = searchQuery.toLowerCase();
    const suggestions = new Set<string>();
    allVideos.forEach(video => {
      if (video.title.toLowerCase().includes(lowerCaseQuery)) {
        suggestions.add(video.title);
      }
    });
    return Array.from(suggestions);
  }, [allVideos, searchQuery]);


  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX);
    setDraggedDistance(0);
    overlappingBannersWrapperRef.current?.classList.add('active-drag');
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const walk = e.pageX - startX;
    setDraggedDistance(walk);

    const newTranslateX = currentTranslateX + walk;

    const bannerWidth = 600;
    const overlap = 225;
    const step = bannerWidth - overlap;

    const totalContentWidth = bannerWidth + (bannerImages.length - 1) * step;
    const wrapperVisibleWidth = overlappingBannersWrapperRef.current?.clientWidth || 0;

    const actualMinTranslateX = totalContentWidth > wrapperVisibleWidth ? (wrapperVisibleWidth - totalContentWidth) : 0;
    const maxTranslateX = 0;

    const clampedTranslateX = Math.max(actualMinTranslateX, Math.min(newTranslateX, maxTranslateX));
    setCurrentTranslateX(clampedTranslateX);
  }, [isDragging, startX, currentTranslateX, bannerImages.length]);

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
    overlappingBannersWrapperRef.current?.classList.remove('active-drag');
    setStartX(0);

    const bannerWidth = 600;
    const overlap = 225;
    const step = bannerWidth - overlap;

    const currentOffset = -currentTranslateX;
    let closestBannerIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < bannerImages.length; i++) {
        const targetOffset = i * step;
        const distance = Math.abs(currentOffset - targetOffset);
        if (distance < minDistance) {
            minDistance = distance;
            closestBannerIndex = i;
        }
    }
    setLastActiveBannerIndex(closestBannerIndex);
  }, [isDragging, currentTranslateX, bannerImages.length]);

  useEffect(() => {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node) &&
          showFilterOptions) {
        setShowFilterOptions(false);
      }
      // 정렬 드롭다운은 select 요소이므로 별도의 외부 클릭 감지 로직이 필요하지 않음.
      // select는 자체적으로 외부 클릭 시 닫히는 동작을 가짐.
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterOptions]);


  const UnifiedBanner = ({
    imageSrc,
    videoId,
    topText,
    middleText,
    bottomText,
    index,
    onMouseEnter,
    onMouseLeave,
  }: {
    imageSrc: string;
    videoId: string;
    topText?: string;
    middleText?: string;
    bottomText?: string;
    index: number;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  }) => {
    const isActive = hoveredBannerIndex === index || (hoveredBannerIndex === null && lastActiveBannerIndex === index);

    const handleBannerClick = () => {
      if (Math.abs(draggedDistance) > 10) {
        return;
      }
      console.log(`영상을 재생합니다: /video/${videoId}`);
      alert(`'${videoId}' 영상으로 이동합니다.`);
    };

    return (
      <div
        className={`banner-container ${isActive ? "active" : ""}`}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={handleBannerClick}
      >
        <img src={imageSrc} className="banner-image" alt="배너 이미지" />
        <div className="text-overlay">
          {isActive && <div className="toptext">{topText}</div>}
          <div className="middletext">{middleText}</div>
          <div className="bottomtext">{bottomText}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="ex-container">
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
          {/* 돋보기 / X 버튼 전환 */}
          {searchQuery.length > 0 ? (
            <span className="search-icon clear-icon" onClick={() => setSearchQuery("")}>
              &times; {/* X 문자 */}
            </span>
          ) : (
            <span className="search-icon">
              <img src={searchimg} className="search-image" alt="배너 이미지" />
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
          <button className="filter-button" onClick={() => setShowFilterOptions(!showFilterOptions)}>
            <span className="filter-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                </svg>
            </span>
          </button>
          {showFilterOptions && (
            <div className="filter-options-dropdown">
              <label>
                <input
                  type="checkbox"
                  checked={showOnlyCorrectionVideos}
                  onChange={() => setShowOnlyCorrectionVideos(!showOnlyCorrectionVideos)}
                />
                자세 교정 가능한 영상만 보기
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={showOnlyFavoriteVideos}
                  onChange={() => setShowOnlyFavoriteVideos(!showOnlyFavoriteVideos)}
                />
                즐겨 찾기한 영상만 보기
              </label>
            </div>
          )}
        </div>

        <div className="sort-dropdown-wrapper" ref={sortDropdownRef}>
          <select className="sort-dropdown" value={sortType} onChange={(e) => setSortType(e.target.value as "recent" | "like" | "watch")}>
            <option value="recent">최신순</option>
            <option value="like">추천순</option>
            <option value="watch">조회순</option>
          </select>
          <span className="dropdown-arrow"></span>
        </div>
      </div>


      {/* 배너 섹션 - 드래그 가능 */}
      <div
        className="overlapping-banners-wrapper"
        ref={overlappingBannersWrapperRef}
        onMouseDown={onMouseDown}
        onMouseLeave={() => {
            if (!isDragging) {
                setHoveredBannerIndex(null);
            }
        }}
      >
        <div className="banners-inner-container" style={{ transform: `translateX(${currentTranslateX}px)` }}>
          {bannerImages.map((banner, index) => (
            <UnifiedBanner
              key={index}
              index={index}
              imageSrc={banner.src}
              videoId={banner.videoId}
              topText={banner.topText}
              middleText={banner.middleText}
              bottomText={banner.bottomText}
              onMouseEnter={() => {
                  setHoveredBannerIndex(index);
                  setLastActiveBannerIndex(index);
              }}
              onMouseLeave={() => {
                  setHoveredBannerIndex(null);
              }}
            />
          ))}
        </div>
      </div>

      
    </div>
  );
};

export default Exercise;