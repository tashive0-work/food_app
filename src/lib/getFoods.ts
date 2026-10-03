import { Food } from "@/types/food";
import { FOODS as FALLBACK_FOODS } from "@/data/foods";

/**
 * Supabase foods 테이블에서 active=true 인 전체 메뉴를 .range() 1000개 루프로 끝까지 수집.
 * 1시간 캐시(tags: ['foods']) 적용.
 * DB 장애 또는 오류 시 src/data/foods.ts 의 FALLBACK_FOODS 비상용 반환.
 */
export async function getLiveFoods(): Promise<{ foods: Food[]; totalCount: number }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { foods: FALLBACK_FOODS, totalCount: FALLBACK_FOODS.length };
  }

  try {
    const allRows: any[] = [];
    const pageSize = 1000;
    let page = 0;
    let hasMore = true;
    let totalCount = 0;

    while (hasMore) {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/foods?active=eq.true&select=id,name,kind,spice,fill,warm,ease,comfort,light,themes,variants,popularity,soup,source&order=id.asc`;

      const res = await fetch(url, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Range: `${from}-${to}`,
          Prefer: 'count=exact',
        },
        next: {
          revalidate: 3600, // 1시간 캐시
          tags: ['foods'],
        },
      });

      if (!res.ok) {
        console.warn(`[getLiveFoods] Supabase fetch status ${res.status}, using fallback.`);
        return { foods: FALLBACK_FOODS, totalCount: FALLBACK_FOODS.length };
      }

      const contentRange = res.headers.get('content-range');
      if (contentRange && contentRange.includes('/')) {
        const totalStr = contentRange.split('/')[1];
        if (totalStr && totalStr !== '*') {
          totalCount = parseInt(totalStr, 10);
        }
      }

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        hasMore = false;
      } else {
        allRows.push(...data);
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      }
    }

    if (allRows.length === 0) {
      return { foods: FALLBACK_FOODS, totalCount: FALLBACK_FOODS.length };
    }

    const mappedFoods: Food[] = allRows.map((row: any) => ({
      id: Number(row.id),
      name: String(row.name || ''),
      kind: String(row.kind || '기타'),
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
    }));

    return { foods: mappedFoods, totalCount: totalCount || mappedFoods.length };
  } catch (err: any) {
    console.warn('[getLiveFoods] Error fetching live foods, using fallback:', err?.message);
    return { foods: FALLBACK_FOODS, totalCount: FALLBACK_FOODS.length };
  }
}
