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
