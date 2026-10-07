-- 음료 메뉴에 영어 설명(image_query)을 넣습니다.
-- 왜: 생성 모델이 '루이보스'·'교쿠로' 같은 한국어 고유명사를 못 알아듣고
--     엉뚱한 한식 사진을 만들었습니다. 영어 설명을 주면 제대로 그립니다.
-- 이 SQL 은 image_query 만 바꿉니다. 사진이나 다른 값은 건드리지 않습니다.

UPDATE foods SET image_query = 'chamomile herbal tea, pale gold, in a clear glass cup' WHERE id = 1677;  -- 캐모마일
UPDATE foods SET image_query = 'black tea latte, light brown, in a cup' WHERE id = 1690;  -- 홍차라떼
UPDATE foods SET image_query = 'bicerin, Turin layered espresso chocolate and cream drink in a small glass' WHERE id = 1696;  -- 비체린
UPDATE foods SET image_query = 'Earl Grey black tea in a teacup' WHERE id = 1699;  -- 얼그레이
UPDATE foods SET image_query = 'iced chocolate milk drink with ice in a tall glass' WHERE id = 1705;  -- 아이스초코
UPDATE foods SET image_query = 'cold brew coffee, black, over ice in a tall glass' WHERE id = 1715;  -- 콜드브루
UPDATE foods SET image_query = 'brown sugar bubble tea frappe with tapioca pearls in a tall cup' WHERE id = 1717;  -- 흑당 버블 프라페
UPDATE foods SET image_query = 'cold brew coffee topped with thick whipped cream in a tall glass' WHERE id = 1722;  -- 콜드브루 아인슈페너
UPDATE foods SET image_query = 'einspanner coffee topped with thick whipped cream in a glass' WHERE id = 1725;  -- 아인슈페너
UPDATE foods SET image_query = 'Korean drinkable yogurt, sweet and white, in a small glass' WHERE id = 1729;  -- 요구르트
UPDATE foods SET image_query = 'cold brew coffee layered with sweet condensed milk in a tall glass' WHERE id = 1731;  -- 돌체 콜드브루
UPDATE foods SET image_query = 'borisudan, Korean chilled barley pearl punch in a small bowl' WHERE id = 1733;  -- 보리수단
UPDATE foods SET image_query = 'Korean fruit-flavoured carbonated soft drink over ice in a glass' WHERE id = 1735;  -- 데미소다
UPDATE foods SET image_query = 'hibiscus herbal tea, deep red, in a clear glass cup' WHERE id = 1739;  -- 히비스커스
UPDATE foods SET image_query = 'lungo, long-pulled espresso in a small coffee cup' WHERE id = 1754;  -- 룽고
UPDATE foods SET image_query = 'Korean milk-flavoured white carbonated soft drink over ice in a glass' WHERE id = 1756;  -- 암바사
UPDATE foods SET image_query = 'blueberry juice in a glass' WHERE id = 1763;  -- 블루베리주스
UPDATE foods SET image_query = 'Darjeeling black tea, light amber, in a clear teacup' WHERE id = 1765;  -- 다즐링
UPDATE foods SET image_query = 'genmaicha brown rice green tea, pale yellow-green, in a cup' WHERE id = 1767;  -- 현미녹차
UPDATE foods SET image_query = 'Vietnamese milk tea with condensed milk in a tall glass' WHERE id = 1778;  -- 베트남 밀크티
UPDATE foods SET image_query = 'Korean fruit juice soft drink in a glass' WHERE id = 1783;  -- 미과수
UPDATE foods SET image_query = 'lapsang souchong smoked black tea, dark amber, in a teacup' WHERE id = 1788;  -- 랍상소우총
UPDATE foods SET image_query = 'peppermint herbal tea with mint leaves in a clear glass cup' WHERE id = 1789;  -- 페퍼민트
UPDATE foods SET image_query = 'ginger ale over ice in a tall glass' WHERE id = 1792;  -- 진저에일
UPDATE foods SET image_query = 'drinkable yogurt smoothie in a tall glass with a straw' WHERE id = 1798;  -- 요거트스무디
UPDATE foods SET image_query = 'flat white coffee with thin microfoam in a small cup' WHERE id = 1804;  -- 플랫화이트
UPDATE foods SET image_query = 'Korean traditional medicinal herbal tea in a small ceramic cup' WHERE id = 1812;  -- 생맥산
UPDATE foods SET image_query = 'Korean grape juice drink with grape pieces in a glass' WHERE id = 1813;  -- 포도봉봉
UPDATE foods SET image_query = 'oat milk drink in a glass' WHERE id = 1830;  -- 귀리음료
UPDATE foods SET image_query = 'lemongrass herbal tea, pale yellow, in a clear glass cup' WHERE id = 1837;  -- 레몬그라스
UPDATE foods SET image_query = 'ristretto, short espresso shot in a small cup' WHERE id = 1844;  -- 리스트레토
UPDATE foods SET image_query = 'chocolate smoothie in a tall glass with a straw' WHERE id = 1849;  -- 초코스무디
UPDATE foods SET image_query = 'drinking vinegar beverage diluted with water over ice in a glass' WHERE id = 1851;  -- 마시는 식초
UPDATE foods SET image_query = 'cafe au lait in a wide cup' WHERE id = 1857;  -- 카페오레
UPDATE foods SET image_query = 'lemonade with ice and a lemon slice in a tall glass' WHERE id = 1887;  -- 레모네이드
UPDATE foods SET image_query = 'still drinking water in a clear glass' WHERE id = 1890;  -- 생수
UPDATE foods SET image_query = 'shakerato, shaken iced espresso with foam in a stemmed glass' WHERE id = 1894;  -- 샤케라토
UPDATE foods SET image_query = 'jehotang, Korean traditional chilled herbal honey drink in a small bowl' WHERE id = 1911;  -- 제호탕
UPDATE foods SET image_query = 'cortado coffee in a small clear glass' WHERE id = 1916;  -- 코르타도
UPDATE foods SET image_query = 'baesuk, Korean poached pear punch in a small bowl' WHERE id = 1919;  -- 배숙
UPDATE foods SET image_query = 'green detox vegetable juice in a tall glass' WHERE id = 1923;  -- 해독주스
UPDATE foods SET image_query = 'gyokuro Japanese green tea, pale green, in a small ceramic cup' WHERE id = 1928;  -- 교쿠로
UPDATE foods SET image_query = 'vanilla milkshake in a tall glass with a straw' WHERE id = 1930;  -- 바닐라쉐이크
UPDATE foods SET image_query = 'mixed berry iced tea in a tall glass' WHERE id = 1932;  -- 베리티
UPDATE foods SET image_query = 'coffee brewed from a capsule machine, in a cup' WHERE id = 1940;  -- 캡슐커피
UPDATE foods SET image_query = 'cold brew coffee topped with vanilla sweet cream in a tall glass' WHERE id = 1946;  -- 바닐라 크림 콜드브루
UPDATE foods SET image_query = 'Assam black tea, deep amber, in a teacup' WHERE id = 1948;  -- 아삼
UPDATE foods SET image_query = 'rooibos red herbal tea in a clear glass cup' WHERE id = 1949;  -- 루이보스
UPDATE foods SET image_query = 'masala chai, spiced milk tea in a cup' WHERE id = 1951;  -- 마살라짜이
UPDATE foods SET image_query = 'royal milk tea, creamy brown, in a cup' WHERE id = 1953;  -- 로열밀크티
UPDATE foods SET image_query = 'Korean pine bud flavoured clear soft drink in a glass' WHERE id = 1956;  -- 솔의눈
UPDATE foods SET image_query = 'decaffeinated cold brew coffee over ice in a tall glass' WHERE id = 1960;  -- 디카페인 콜드브루
UPDATE foods SET image_query = 'Korean milk-flavoured carbonated soft drink over ice in a glass' WHERE id = 1963;  -- 밀키스
UPDATE foods SET image_query = 'sparkling water with ice in a clear glass' WHERE id = 1973;  -- 탄산수
UPDATE foods SET image_query = 'drinkable yogurt in a tall glass' WHERE id = 1985;  -- 마시는요거트
UPDATE foods SET image_query = 'English breakfast black tea in a teacup' WHERE id = 1991;  -- 잉글리시 브렉퍼스트
UPDATE foods SET image_query = 'nitro cold brew coffee with a creamy foam head in a glass' WHERE id = 1993;  -- 니트로 콜드브루
UPDATE foods SET image_query = 'orange carbonated soft drink over ice in a glass' WHERE id = 1994;  -- 환타
UPDATE foods SET image_query = 'long black coffee in a cup' WHERE id = 1995;  -- 롱블랙
UPDATE foods SET image_query = 'Korean hangover-relief drink poured into a small glass' WHERE id = 2011;  -- 숙취해소음료
UPDATE foods SET image_query = 'virgin mojito, sparkling lime and mint drink in a tall glass' WHERE id = 2014;  -- 무알콜 모히토
UPDATE foods SET image_query = 'strawberry yogurt drink in a tall glass with a straw' WHERE id = 2020;  -- 딸기요거트드링크

-- 총 62개