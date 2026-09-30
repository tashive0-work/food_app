import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// 1. .env.local 직접 파싱
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local 파일이 존재하지 않습니다.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[key] = val;
  }
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY를 찾을 수 없습니다.');
  process.exit(1);
}

// 키 앞 4글자와 전체 길이만 출력
const keyPrefix = anonKey.slice(0, 4);
const keyLength = anonKey.length;
console.log(`URL: ${supabaseUrl}`);
console.log(`Anon Key: 앞 4글자 "${keyPrefix}", 전체 길이 ${keyLength}`);

const supabase = createClient(supabaseUrl, anonKey);

async function runCheck() {
  console.log('\n--- [테스트 시작] ---');

  // (a) 읽기 테스트
  console.log('(a) from("foods").select("name").limit(1) 읽기 테스트 진행...');
  const { data: readData, error: readError } = await supabase
    .from('foods')
    .select('name')
    .limit(1);

  if (readError) {
    console.log('[읽기 결과]: 실패');
    console.log('[읽기 에러 원문]:', JSON.stringify(readError, null, 2));
  } else {
    console.log('[읽기 결과]: 성공');
    console.log('[읽은 데이터]:', readData);
  }

  // (b) 쓰기 테스트
  console.log('\n(b) from("sessions").insert(...) 쓰기 테스트 진행...');
  const testId = `healthcheck_${Date.now()}`;
  const { data: insertData, error: insertError } = await supabase
    .from('sessions')
    .insert({ anon_id: testId, device_type: 'test' })
    .select();

  if (insertError) {
    console.log('[쓰기 결과]: 실패');
    console.log('[쓰기 에러 원문]:', JSON.stringify(insertError, null, 2));
  } else {
    console.log('[쓰기 결과]: 성공');
    console.log('[생성 데이터]:', insertData);

    // 성공한 경우 방금 넣은 행 삭제
    console.log('테스트 데이터 정리(삭제) 진행...');
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('anon_id', testId);

    if (deleteError) {
      console.log('[정리 에러]:', deleteError.message);
    } else {
      console.log('[정리 완료]: 방금 생성한 행이 정상적으로 삭제되었습니다.');
    }
  }

  console.log('--- [테스트 종료] ---\n');
}

runCheck().catch((err) => {
  console.error('실행 중 예외 발생:', err);
});
