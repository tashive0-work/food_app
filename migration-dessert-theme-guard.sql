-- 디저트·카페 메뉴에 식사 테마(퇴근·점심·야식…)가 붙는 것을 DB에서 막습니다.
--
-- 왜 DB인가: 메뉴는 어드민 화면이 아니라 Supabase 에서 직접, 또는 스크립트로 넣습니다.
--            어느 경로로 넣어도 막히려면 테이블에 걸어 두는 수밖에 없습니다.
--
-- 하는 일: kind 가 '디저트·카페' 이면 themes 를 ['카페·디저트'] 로 강제합니다.
--          넣을 때(INSERT)도, 고칠 때(UPDATE)도 적용됩니다.
--
-- themes 컬럼이 text[] 인지 jsonb 인지 몰라서, 실제 타입을 보고 알맞은 쪽으로 만듭니다.

DO $outer$
DECLARE col_type text;
BEGIN
  SELECT udt_name INTO col_type
    FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'foods' AND column_name = 'themes';

  IF col_type = '_text' THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION enforce_dessert_theme() RETURNS trigger AS $body$
      BEGIN
        IF NEW.kind = '디저트·카페' THEN
          NEW.themes := ARRAY['카페·디저트']::text[];
        END IF;
        RETURN NEW;
      END;
      $body$ LANGUAGE plpgsql;
    $fn$;
    RAISE NOTICE 'themes 는 text[] 입니다. 그에 맞게 만들었습니다.';

  ELSIF col_type = 'jsonb' THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION enforce_dessert_theme() RETURNS trigger AS $body$
      BEGIN
        IF NEW.kind = '디저트·카페' THEN
          NEW.themes := '["카페·디저트"]'::jsonb;
        END IF;
        RETURN NEW;
      END;
      $body$ LANGUAGE plpgsql;
    $fn$;
    RAISE NOTICE 'themes 는 jsonb 입니다. 그에 맞게 만들었습니다.';

  ELSE
    RAISE EXCEPTION 'themes 컬럼 타입을 알 수 없습니다: %. 이 값을 알려주세요.', col_type;
  END IF;
END
$outer$;

DROP TRIGGER IF EXISTS trg_enforce_dessert_theme ON foods;
CREATE TRIGGER trg_enforce_dessert_theme
  BEFORE INSERT OR UPDATE ON foods
  FOR EACH ROW EXECUTE FUNCTION enforce_dessert_theme();

-- 이미 들어가 있는 것들도 한 번 정리합니다.
-- (트리거가 알아서 바꾸므로 kind 를 자기 자신으로 덮어쓰기만 하면 됩니다)
UPDATE foods SET kind = kind WHERE kind = '디저트·카페';

-- 확인용 — 0 이 나와야 정상입니다.
SELECT count(*) AS "식사테마가_남은_디저트"
  FROM foods
 WHERE kind = '디저트·카페'
   AND themes::text NOT IN ('{카페·디저트}', '["카페·디저트"]');
