export function getAnonymousId(): string {
  if (typeof window === "undefined") return "server-side";
  let id = localStorage.getItem("food_anon_id");
  if (!id) {
    id = "anon_" + Math.random().toString(36).substring(2) + "_" + Date.now().toString(36);
    localStorage.setItem("food_anon_id", id);
  }
  return id;
}

export function getDeviceType(): string {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return "mobile";
  if (/ipad|tablet/i.test(ua)) return "tablet";
  return "desktop";
}
