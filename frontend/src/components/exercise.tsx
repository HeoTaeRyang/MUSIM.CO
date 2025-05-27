// src/pages/Exercise.tsx

import "../styles/Exercise.css";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import axios from "axios"; // axios 임포트
import { useNavigate } from "react-router-dom"; // ★★★ useNavigate 임포트 추가 ★★★

// ★★★ 이미지 임포트 추가 (src/assets 폴더에 이미지가 있다고 가정) ★★★
import searchimg from "../assets/search.png";
import exe_main from "../assets/exe_main.png";
import exe_main2 from "../assets/exe_main2.png";
import exe_main3 from "../assets/exe_main3.png";

import thumbnail1 from "../assets/thumbnail1.png";
import thumbnail2 from "../assets/thumbnail2.png";
import thumbnail3 from "../assets/thumbnail3.png";
import thumbnail4 from "../assets/thumbnail4.png";
import thumbnail5 from "../assets/thumbnail5.png";
import thumbnail6 from "../assets/thumbnail6.png";
import thumbnail7 from "../assets/thumbnail7.png";
import thumbnail8 from "../assets/thumbnail8.png";
import thumbnail9 from "../assets/thumbnail9.png";

// API 통신을 위한 기본 URL (백엔드 서버 주소로 변경해주세요!)
// 현재 Flask 서버는 HTTP만 지원하므로, 반드시 http:// 로 유지해야 합니다.
const API_BASE_URL = "http://127.0.0.1:5000"; // ★★★ 중요: http:// 로 유지! ★★★

// 백엔드 API 응답 형식에 맞춰 재정의된 Video 인터페이스
interface Video {
  id: number;
  views: number;
  recommendations: number; // 'likes' 대신 'recommendations'
  upload_date: string; // 'date' 대신 'upload_date'
  title: string;
  video_url: string; // 'videoId' 대신 'video_url'
  correctable: number; // 'isCorrection' 대신 'correctable' (1 또는 0)
  isFavorite?: boolean; // 백엔드에서 오지 않을 수 있으므로 optional
  thumbnail_url: string; // 'thumbnail' 대신 'thumbnail_url'

  // 추가 필드 (API 응답에 포함됨)
  description: string;
  product_link: string | null;
}

// 오늘의 추천 영상 데이터 타입 정의 (Video 인터페이스 확장)
interface TodayVideo extends Video {
  topText?: string;
  middleText?: string;
  bottomText?: string;
}

// 💡 더미 데이터 정의 - 이미지 경로 반영 (실제 재생 가능한 샘플 비디오 URL 사용)
const DUMMY_TODAY_VIDEOS: TodayVideo[] = [
  {
    id: 9991,
    views: 12345,
    recommendations: 500,
    upload_date: "Mon, 24 May 2024 10:00:00 GMT",
    title: "더미 오늘의 추천 운동 1",
    video_url:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // 실제 더미 비디오 URL
    correctable: 1,
    isFavorite: false,
    thumbnail_url: exe_main, // ★ exe_main 이미지 적용
    description: "이것은 오늘의 추천 운동 더미 영상 1입니다.",
    product_link: null,
    topText: "🔥 오류 시 대체 운동 1",
    middleText: "더미 오늘의 추천 운동 1",
    bottomText: "조회수: 12,345회 | 추천수: 500회",
  },
  {
    id: 9992,
    views: 23456,
    recommendations: 700,
    upload_date: "Tue, 25 May 2024 11:00:00 GMT",
    title: "더미 오늘의 추천 운동 2",
    video_url:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", // 실제 더미 비디오 URL
    correctable: 0,
    isFavorite: false,
    thumbnail_url: exe_main2, // ★ exe_main2 이미지 적용
    description: "이것은 오늘의 추천 운동 더미 영상 2입니다.",
    product_link: null,
    topText: "🌟 추가 추천 운동 2",
    middleText: "더미 오늘의 추천 운동 2",
    bottomText: "조회수: 23,456회 | 추천수: 700회",
  },
  {
    id: 9993,
    views: 34567,
    recommendations: 900,
    upload_date: "Wed, 26 May 2024 12:00:00 GMT",
    title: "더미 오늘의 추천 운동 3",
    video_url:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", // 실제 더미 비디오 URL
    correctable: 1,
    isFavorite: true,
    thumbnail_url: exe_main3, // ★ exe_main3 이미지 적용
    description: "이것은 오늘의 추천 운동 더미 영상 3입니다.",
    product_link: null,
    topText: "💪 스페셜 추천 운동 3",
    middleText: "더미 오늘의 추천 운동 3",
    bottomText: "조회수: 34,567회 | 추천수: 900회",
  },
];

const DUMMY_VIDEOS: Video[] = [
  {
    id: 101,
    views: 1500,
    recommendations: 120,
    upload_date: "Wed, 22 May 2024 14:30:00 GMT",
    title: "더미 영상 1: 강력한 코어 운동",
    video_url:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    correctable: 1,
    isFavorite: false,
    thumbnail_url: thumbnail1, // ★ thumbnail1 적용
    description: "코어 근육을 강화하는 효과적인 운동 루틴입니다.",
    product_link: null,
  },
  {
    id: 102,
    views: 800,
    recommendations: 70,
    upload_date: "Tue, 21 May 2024 09:15:00 GMT",
    title: "더미 영상 2: 유연성 스트레칭",
    video_url:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    correctable: 0,
    isFavorite: true,
    thumbnail_url: thumbnail2, // ★ thumbnail2 적용
    description: "하루를 상쾌하게 시작하는 모닝 스트레칭입니다.",
    product_link: null,
  },
  {
    id: 103,
    views: 2200,
    recommendations: 180,
    upload_date: "Mon, 20 May 2024 18:45:00 GMT",
    title: "더미 영상 3: 전신 고강도 인터벌",
    video_url:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    correctable: 1,
    isFavorite: false,
    thumbnail_url: thumbnail3, // ★ thumbnail3 적용
    description: "단시간에 효과를 볼 수 있는 HIIT 운동입니다.",
    product_link: "https://example.com/product/1",
  },
  {
    id: 104,
    views: 500,
    recommendations: 30,
    upload_date: "Sun, 19 May 2024 10:00:00 GMT",
    title: "더미 영상 4: 요가 초보자 가이드",
    video_url:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    correctable: 0,
    isFavorite: false,
    thumbnail_url: thumbnail4, // ★ thumbnail4 적용
    description: "요가를 처음 시작하는 분들을 위한 기본 가이드입니다.",
    product_link: null,
  },
  {
    id: 105,
    views: 3000,
    recommendations: 250,
    upload_date: "Sat, 18 May 2024 16:00:00 GMT",
    title: "더미 영상 5: 상체 근력 운동",
    video_url:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    correctable: 1,
    isFavorite: true,
    thumbnail_url: thumbnail5, // ★ thumbnail5 적용
    description: "집에서 할 수 있는 효과적인 상체 운동입니다.",
    product_link: null,
  },
  {
    id: 106,
    views: 1200,
    recommendations: 90,
    upload_date: "Fri, 17 May 2024 07:00:00 GMT",
    title: "더미 영상 6: 하체 집중 운동",
    video_url:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    correctable: 1,
    isFavorite: false,
    thumbnail_url: thumbnail6, // ★ thumbnail6 적용
    description: "탄탄한 하체를 위한 스쿼트 및 런지 루틴.",
    product_link: null,
  },
  {
    id: 107,
    views: 900,
    recommendations: 50,
    upload_date: "Thu, 16 May 2024 11:30:00 GMT",
    title: "더미 영상 7: 명상 및 이완",
    video_url:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
    correctable: 0,
    isFavorite: false,
    thumbnail_url: thumbnail7, // ★ thumbnail7 적용
    description: "스트레스 해소와 마음의 안정을 위한 명상.",
    product_link: null,
  },
  {
    id: 108,
    views: 1800,
    recommendations: 150,
    upload_date: "Wed, 15 May 2024 13:00:00 GMT",
    title: "더미 영상 8: 복근 강화 운동",
    video_url:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    correctable: 1,
    isFavorite: false,
    thumbnail_url: thumbnail8, // ★ thumbnail8 적용
    description: "선명한 복근을 만드는 데 도움을 주는 운동.",
    product_link: null,
  },
  {
    id: 109,
    views: 2500,
    recommendations: 200,
    upload_date: "Tue, 14 May 2024 08:00:00 GMT",
    title: "더미 영상 9: 유산소 인터벌",
    video_url:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    correctable: 0,
    isFavorite: true,
    thumbnail_url: thumbnail9, // ★ thumbnail9 적용
    description: "체지방 감소에 효과적인 유산소 인터벌 트레이닝.",
    product_link: null,
  },
];

const Exercise = () => {
  const [sortType, setSortType] = useState<"recent" | "like" | "watch">(
    "recent"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [lastActiveBannerIndex, setLastActiveBannerIndex] = useState<number>(0);
  const [hoveredBannerIndex, setHoveredBannerIndex] = useState<number | null>(
    null
  );
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentTranslateX, setCurrentTranslateX] = useState(0);
  const [draggedDistance, setDraggedDistance] = useState(0); // ★★★ 드래그 거리 추적 상태 유지 ★★★

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

  // ----------------------------------------------------
  // API 호출 로직 시작
  // ----------------------------------------------------

  // /video/today API 호출 (메인 배너 영상)
  const fetchTodayVideos = useCallback(async () => {
    setLoadingBanner(true);
    setErrorBanner(null);
    try {
      const response = await axios.get<Video>(`${API_BASE_URL}/video/today`);
      const data: Video = response.data;

      console.log("✔️ /video/today API 응답 성공:", data);

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
      setBannerVideos(DUMMY_TODAY_VIDEOS);
    } finally {
      setLoadingBanner(false);
    }
  }, []);

  // 하단 영상 목록 API 호출
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

        if (filterCorrection) {
          url = `${API_BASE_URL}/video/correctable`;
        } else if (filterFavorite) {
          url = `${API_BASE_URL}/video/favorite`;
          method = "POST";
          body = { id: 1 }; // TODO: 실제 user_id 사용
        } else if (currentSearchQuery.trim() !== "") {
          url = `${API_BASE_URL}/video/search`;
          method = "POST";
          body = { keyword: currentSearchQuery };
        } else if (currentSortType !== "recent") {
          url = `${API_BASE_URL}/video/sort`;
          method = "POST";
          body = { keyword: currentSortType };
        }

        const response = await axios({
          url: url,
          method: method,
          data: body,
        });
        const data: Video[] = response.data;

        console.log(`✔️ ${url} API 응답 성공:`, data);

        let sortedData = [...data];
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
        setVideosToDisplay(DUMMY_VIDEOS);
      } finally {
        setLoadingVideos(false);
      }
    },
    []
  );

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

  // ----------------------------------------------------
  // API 호출 로직 끝
  // ----------------------------------------------------

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

  // ★★★ 드래그 시작 시점의 마우스 좌표 저장 (클릭 판별용) ★★★
  const mouseDownClientX = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX);
    setDraggedDistance(0); // 드래그 시작 시점에 거리 초기화
    mouseDownClientX.current = e.clientX; // 마우스 다운 시점의 X 좌표 저장
    overlappingBannersWrapperRef.current?.classList.add("active-drag");
  }, []);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const walk = e.pageX - startX;
      setCurrentTranslateX((prevTranslateX) => prevTranslateX + walk); // 현재 translateX 업데이트
      setStartX(e.pageX); // 다음 이동을 위해 시작점 업데이트
      setDraggedDistance(
        (prevDistance) =>
          prevDistance + Math.abs(e.clientX - mouseDownClientX.current)
      ); // ★★★ 총 드래그 거리 업데이트 ★★★

      const bannerWidth = 600;
      const overlap = 225;
      const step = bannerWidth - overlap;

      const totalContentWidth = bannerWidth + (bannerVideos.length - 1) * step;
      const wrapperVisibleWidth =
        overlappingBannersWrapperRef.current?.clientWidth || 0;

      const actualMinTranslateX =
        totalContentWidth > wrapperVisibleWidth
          ? wrapperVisibleWidth - totalContentWidth
          : 0;
      const maxTranslateX = 0;

      setCurrentTranslateX((prev) =>
        Math.max(actualMinTranslateX, Math.min(prev, maxTranslateX))
      );
    },
    [isDragging, startX, bannerVideos.length] // currentTranslateX는 콜백 안에서 prev로 접근
  );

  const onMouseUp = useCallback(
    (e: MouseEvent) => {
      setIsDragging(false);
      overlappingBannersWrapperRef.current?.classList.remove("active-drag");

      // ★★★ 마우스 다운과 업 사이의 총 이동 거리를 이용하여 클릭 판별 ★★★
      // 이 draggedDistance는 onMouseMove에서 지속적으로 업데이트된 값입니다.
      // 임계값 (예: 5px) 미만으로 움직였다면 클릭으로 간주
      if (Math.abs(e.clientX - mouseDownClientX.current) < 5) {
        // 클릭으로 간주하고, 해당 배너의 클릭 핸들러를 실행
        // 이 로직은 UnifiedBanner 내부의 onClick과 별개로 작동해야 함.
        // 따라서 클릭 이벤트는 onMouseUp에서 처리하는 것이 더 정확함.
        // UnifiedBanner의 onClick은 그대로 두고, 여기서 드래그가 아닐 때만 onClick이벤트가 발생하게 할 수 있음.
        // 하지만 가장 확실한 방법은 onMouseUp에서 클릭 여부 판단 후 직접 navigate 하는 것.
        // 여기서는 `UnifiedBanner`의 `onClick`이 여전히 호출될 것이므로,
        // `UnifiedBanner` 내부에서 `draggedDistance`를 상태로 받는 것이 더 직관적일 수 있음.
        // 더 깔끔한 해결책: `UnifiedBanner`의 `onClick`에 드래그 여부를 전달하여 처리.
        // 하지만 현재 구조상 `draggedDistance`는 Exercise 컴포넌트의 상태.
        // 클릭 시 `handleBannerClick`을 호출하고, 그 안에서 `draggedDistance`를 확인하는 것이 원래 코드의 의도와 맞음.
        // 그래서 `UnifiedBanner`의 `handleBannerClick` 로직을 더 견고하게 수정해야 합니다.
        // 일단 기존 로직대로 `draggedDistance`를 활용하되,
        // `onMouseMove`에서 `setDraggedDistance` 로직을 수정하여
        // `mouseDownClientX`와 `e.clientX`의 차이를 `draggedDistance`에 저장하도록 함.
        // 그리고 `onMouseUp`에서는 `draggedDistance`를 초기화하지 않고, 클릭 후 초기화.
      }
      setDraggedDistance(0); // 마우스 업 시점에 드래그 거리 초기화
      setStartX(0); // 마우스 업 시점에 시작점 초기화 (현재 불필요하지만 일관성을 위해)

      // onMouseUp에서 최종적인 active index 설정
      const bannerWidth = 600;
      const overlap = 225;
      const step = bannerWidth - overlap;

      const currentOffset = -currentTranslateX;
      let closestBannerIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < bannerVideos.length; i++) {
        const targetOffset = i * step;
        const distance = Math.abs(currentOffset - targetOffset);
        if (distance < minDistance) {
          minDistance = distance;
          closestBannerIndex = i;
        }
      }
      setLastActiveBannerIndex(closestBannerIndex);
    },
    [isDragging, currentTranslateX, bannerVideos.length, mouseDownClientX]
  );

  useEffect(() => {
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

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
        // 드롭다운이 열려있는 상태를 관리하는 별도 상태가 없으므로, 필요하면 추가
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterOptions]);

  // ★★★ UnifiedBanner 컴포넌트 수정 ★★★
  const UnifiedBanner = ({
    imageSrc,
    videoData,
    topText,
    middleText,
    bottomText,
    index,
    onMouseEnter,
    onMouseLeave,
    // draggedDistance prop을 받도록 추가
    currentDraggedDistance, // ★★★ 새로 추가된 prop ★★★
  }: {
    imageSrc: string;
    videoData: Video;
    topText?: string;
    middleText?: string;
    bottomText?: string;
    index: number;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    currentDraggedDistance: number; // ★★★ 새로 추가된 prop 타입 ★★★
  }) => {
    const isActive =
      hoveredBannerIndex === index ||
      (hoveredBannerIndex === null && lastActiveBannerIndex === index);

    // ★★★ handleBannerClick 로직 변경: 드래그 거리를 직접 prop으로 받아서 판단 ★★★
    const handleBannerClick = () => {
      // 드래그 거리가 특정 임계값(예: 5px)을 초과하면 클릭으로 간주하지 않음
      if (Math.abs(currentDraggedDistance) > 5) {
        console.log(
          "드래그로 간주되어 클릭 무시됨. 이동 거리:",
          currentDraggedDistance
        );
        return;
      }

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
        onClick={handleBannerClick} // onClick 이벤트는 그대로 유지
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
          video: video.video_url,
        },
      },
    });
  };

  return (
    <div className="ex-container">
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
        <div
          className="banners-inner-container"
          style={{ transform: `translateX(${currentTranslateX}px)` }}
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
                  setLastActiveBannerIndex(index);
                }}
                onMouseLeave={() => {
                  setHoveredBannerIndex(null);
                }}
                currentDraggedDistance={draggedDistance} // ★★★ draggedDistance를 prop으로 전달 ★★★
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
            <p>더미 데이터로 표시됩니다.</p>
            <p>
              백엔드 서버가 실행 중인지, `API_BASE_URL`이 올바른지 확인해주세요.
            </p>
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
                    {video.isFavorite && (
                      <span className="favorite-tag">★ 즐겨찾기</span>
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
