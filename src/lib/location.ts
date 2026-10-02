export interface UserCoordinates {
  lat: number;
  lng: number;
}

const LOCATION_CACHE_KEY = "food_user_location";

/** 브라우저 GeoLocation API를 통해 현재 위도/경도를 가져옵니다. */
export function getCurrentLocation(): Promise<UserCoordinates | null> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: UserCoordinates = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        try {
          localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(coords));
        } catch (e) {
          console.error("Location cache error:", e);
        }
        resolve(coords);
      },
      (err) => {
        console.warn("Geolocation position request failed:", err.message);
        // 캐시된 이전 위치 폴백
        try {
          const cached = localStorage.getItem(LOCATION_CACHE_KEY);
          if (cached) resolve(JSON.parse(cached));
          else resolve(null);
        } catch {
          resolve(null);
        }
      },
      { timeout: 8000, maximumAge: 300000, enableHighAccuracy: false }
    );
  });
}

/** 메뉴명과 현재 위치(위도/경도)를 기반으로 네이버 지도 검색 URL을 생성합니다. */
export function getNaverMapUrl(foodName: string, coords?: UserCoordinates | null): string {
  const query = encodeURIComponent(foodName);
  if (coords && coords.lat && coords.lng) {
    return `https://map.naver.com/v5/search/${query}?c=${coords.lat},${coords.lng},15,0,0,dh`;
  }
  return `https://map.naver.com/p/search/${query}`;
}

/** 카카오 지도 검색 URL을 생성합니다. */
export function getKakaoMapUrl(foodName: string): string {
  return `https://map.kakao.com/?q=${encodeURIComponent(foodName)}`;
}

/**
 * 저장해 둔 위치를 읽습니다 (권한을 물어보지 않습니다).
 * 사용자가 한 번 「내 위치 기준으로 보기」를 눌러 허용했을 때만 값이 있습니다.
 */
export function getCachedLocation(): UserCoordinates | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    return typeof c?.lat === "number" && typeof c?.lng === "number" ? c : null;
  } catch {
    return null;
  }
}

/**
 * "이 음식 파는 곳" 지도 검색 주소.
 * 위치를 허용한 적이 있으면 그 주변으로, 아니면 그냥 이름으로 검색합니다.
 * 권한을 새로 물어보지 않으므로 어디서든 바로 쓸 수 있습니다.
 */
export function nearbyUrl(foodName: string): string {
  return getNaverMapUrl(foodName, getCachedLocation());
}
