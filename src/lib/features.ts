/**
 * 기능 플래그 (Feature Flags)
 * 실사용자 공개 전 작동하지 않거나 근거 없는 요소를 화면에서 숨기며,
 * 추후 제휴 계약, 광고 연동, OAuth 설정 완료 시 true로 변경하여 다시 활성화할 수 있습니다.
 */

/** 배달 주문 버튼 표시 여부 (배달앱 검색 웹 URL 404 이슈로 기본 비활성화) */
export const SHOW_DELIVERY = false;

/** 광고 배너(AdSense / 스폰서 배너) 표시 여부 */
export const SHOW_ADS = false;

/** 스폰서 매장 추천 카드 표시 여부 */
export const SHOW_SPONSORED = false;

/** 카카오 소셜 로그인 버튼 표시 여부 (Supabase Kakao OAuth 미설정으로 기본 비활성화) */
export const SHOW_KAKAO_LOGIN = false;
