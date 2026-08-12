import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import crypto from 'node:crypto';

const HOUR_DEFAULT = 10;
const DAY_DEFAULT = 30;
const GLOBAL_DEFAULT = 2000;

const parsedHour = Number(process.env.RATE_LIMIT_PER_HOUR);
const parsedDay = Number(process.env.RATE_LIMIT_PER_DAY);
const parsedGlobal = Number(process.env.DAILY_GLOBAL_CAP);

const RATE_LIMIT_PER_HOUR = Number.isNaN(parsedHour) ? HOUR_DEFAULT : parsedHour;
const RATE_LIMIT_PER_DAY = Number.isNaN(parsedDay) ? DAY_DEFAULT : parsedDay;
const DAILY_GLOBAL_CAP = Number.isNaN(parsedGlobal) ? GLOBAL_DEFAULT : parsedGlobal;
const RATE_LIMIT_SALT = process.env.RATE_LIMIT_SALT || 'default_salt';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_role_key';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; reason: 'HOURLY' | 'DAILY' | 'GLOBAL'; retryAfter: number };

export function getClientIp(req: NextRequest): string {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp && xRealIp.trim()) {
    return xRealIp.trim();
  }
  return 'unknown';
}

export function hashIp(ip: string): string {
  return crypto
    .createHash('sha256')
    .update(ip + RATE_LIMIT_SALT)
    .digest('hex')
    .slice(0, 32);
}

function getKstDateAndSecondsUntilMidnight(): { kstDate: string; kstStartOfDayIso: string; secondsUntilMidnight: number } {
  const nowMs = Date.now();
  const kstMs = nowMs + 9 * 60 * 60 * 1000;
  const kstDate = new Date(kstMs).toISOString().slice(0, 10);
  
  const kstStartOfDayIso = new Date(`${kstDate}T00:00:00+09:00`).toISOString();
  const nextMidnightUtcMs = new Date(`${kstDate}T00:00:00+09:00`).getTime() + 24 * 60 * 60 * 1000;
  const secondsUntilMidnight = Math.max(1, Math.ceil((nextMidnightUtcMs - nowMs) / 1000));

  return { kstDate, kstStartOfDayIso, secondsUntilMidnight };
}

export async function checkRateLimit(req: NextRequest): Promise<RateLimitResult> {
  try {
    const { kstDate, kstStartOfDayIso, secondsUntilMidnight } = getKstDateAndSecondsUntilMidnight();
    const ip = getClientIp(req);
    const ipHash = hashIp(ip);

    // (a) 전역 상한 확인 (RPC)
    try {
      const { data: globalCount, error: rpcError } = await supabase.rpc('increment_api_usage', {
        p_date: kstDate,
        p_endpoint: 're-recommend',
      });

      if (rpcError) {
        console.error('increment_api_usage RPC failed:', rpcError);
      } else if (typeof globalCount === 'number' && globalCount > DAILY_GLOBAL_CAP) {
        return { allowed: false, reason: 'GLOBAL', retryAfter: secondsUntilMidnight };
      }
    } catch (rpcException) {
      console.error('increment_api_usage RPC exception:', rpcException);
    }

    // (b) IP 시간당 확인
    const oneHourAgoIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: hourlyCount, error: hourlyErr } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', oneHourAgoIso);

    if (hourlyErr || hourlyCount === null) {
      console.error('Hourly rate_limits query failed:', hourlyErr);
      return { allowed: false, reason: 'HOURLY', retryAfter: 3600 };
    }

    if (hourlyCount >= RATE_LIMIT_PER_HOUR) {
      return { allowed: false, reason: 'HOURLY', retryAfter: 3600 };
    }

    // (c) IP 일일 확인
    const { count: dailyCount, error: dailyErr } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', kstStartOfDayIso);

    if (dailyErr || dailyCount === null) {
      console.error('Daily rate_limits query failed:', dailyErr);
      return { allowed: false, reason: 'DAILY', retryAfter: secondsUntilMidnight };
    }

    if (dailyCount >= RATE_LIMIT_PER_DAY) {
      return { allowed: false, reason: 'DAILY', retryAfter: secondsUntilMidnight };
    }

    // (d) 통과 시 rate_limits 기록 및 남은 횟수 반환
    const { error: insertErr } = await supabase
      .from('rate_limits')
      .insert({ ip_hash: ipHash, endpoint: 're-recommend' });

    if (insertErr) {
      console.error('Failed to insert rate_limits:', insertErr);
      return { allowed: false, reason: 'HOURLY', retryAfter: 3600 };
    }

    const remaining = Math.max(0, RATE_LIMIT_PER_DAY - dailyCount - 1);
    return { allowed: true, remaining };
  } catch (err) {
    console.error('checkRateLimit unexpected error:', err);
    return { allowed: false, reason: 'HOURLY', retryAfter: 3600 };
  }
}
