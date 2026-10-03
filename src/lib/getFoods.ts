import { Food } from "@/types/food";
import { FOODS as FALLBACK_FOODS } from "@/data/foods";

/**
 * Supabase foods 테이블에서 active=true 인 메뉴 목록을 1시간 캐시(tags: ['foods'])로 조회.
 * DB 장애 또는 오류 시 src/data/foods.ts 의 FALLBACK_FOODS 비상용 반환.
 */
export async function getLiveFoods(): Promise<Food[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return FALLBACK_FOODS;
  }

  try {
    const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/foods?active=eq.true&select=id,name,kind,spice,fill,warm,ease,comfort,light,themes,variants,popularity,soup,source,updated_at`;
    
    const res = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      next: {
        revalidate: 3600, // 1시간 캐시
        tags: ['foods'],  // /api/revalidate?tag=foods 로 즉시 무효화 가능
      },
    });

    if (!res.ok) {
      console.warn(`[getLiveFoods] Supabase fetch status ${res.status}, using fallback.`);
      return FALLBACK_FOODS;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return FALLBACK_FOODS;
    }

    return data.map((row: any) => ({
      id: Number(row.id),
      name: String(row.name || ''),
      kind: String(row.kind || '일반'),
      spice: Number(row.spice ?? 0),
      fill: Number(row.fill ?? 2),
      warm: Number(row.warm ?? 2),
      ease: Number(row.ease ?? 2),
      comfort: Number(row.comfort ?? 2),
      light: Number(row.light ?? 2),
      themes: Array.isArray(row.themes) ? row.themes : [],
      variants: Array.isArray(row.variants) ? row.variants : [],
      popularity: row.popularity != null ? Number(row.popularity) : 1,
      soup: Boolean(row.soup),
      source: row.source ? String(row.source) : undefined,
      updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    }));
  } catch (err: any) {
    console.warn('[getLiveFoods] Error fetching live foods, using fallback:', err?.message);
    return FALLBACK_FOODS;
  }
}
