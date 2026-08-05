import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보 처리방침 - 오늘 뭐 먹지",
  description: "오늘 뭐 먹지 서비스의 개인정보 처리방침입니다.",
};

export default function PrivacyPage() {
  return (
    <div className="app">
      <div className="legalWrap">
        <Link href="/" className="legalBack">
          ← 돌아가기
        </Link>
        <h1 className="legalTitle">개인정보 처리방침</h1>
        <p className="legalMeta">시행일: 2026년 8월 5일</p>

        <section className="legalSec">
          <p>
            <strong>[ 오늘 뭐 먹지 ]</strong> (이하 "서비스")는 「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 보호하기 위해 다음과 같이 개인정보 처리방침을 수립·공개합니다.
          </p>
        </section>

        <section className="legalSec">
          <h2>제1조 (개인정보의 처리 목적)</h2>
          <p>
            서비스는 다음의 목적으로 개인정보를 처리합니다. 처리하는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행합니다.
          </p>
          <ol>
            <li>
              <strong>음식 추천 서비스 제공</strong>
              <br />- 이용자가 입력한 상태 진단 응답을 기반으로 맞춤형 음식 추천 결과를 산출·제공
            </li>
            <li>
              <strong>서비스 품질 개선 및 통계 분석</strong>
              <br />- 이용 패턴 분석을 통한 추천 알고리즘 개선
              <br />- 연령대별·기기별 이용 현황 통계 산출
            </li>
            <li>
              <strong>서비스 운영 및 안정성 확보</strong>
              <br />- 부정 이용 방지, 비정상 요청 차단
            </li>
          </ol>
        </section>

        <section className="legalSec">
          <h2>제2조 (처리하는 개인정보의 항목)</h2>
          <p>
            서비스는 <strong>회원가입 절차 없이</strong> 이용 가능하며, 이름·연락처·이메일 등 이용자를 직접 식별할 수 있는 정보는 수집하지 않습니다.
          </p>

          <h3>1. 이용자가 직접 입력하는 정보</h3>
          <table className="legalTable">
            <thead>
              <tr>
                <th>항목</th>
                <th>내용</th>
                <th>필수 여부</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>연령대</td>
                <td>10대 / 20–30대 / 40–50대 이상 / 미응답</td>
                <td>선택 (미응답 가능)</td>
              </tr>
              <tr>
                <td>상태 진단 응답</td>
                <td>허기·기력·자극·위로·여유·온기 등 8개 문항에 대한 선택 값</td>
                <td>필수</td>
              </tr>
              <tr>
                <td>동행 여부</td>
                <td>혼자 / 둘 / 모임 / 미정</td>
                <td>필수</td>
              </tr>
              <tr>
                <td>추가 요청 문구</td>
                <td>AI 재추천 기능 이용 시 이용자가 입력하는 자유 텍스트</td>
                <td>선택</td>
              </tr>
            </tbody>
          </table>

          <h3>2. 서비스 이용 과정에서 자동으로 생성·수집되는 정보</h3>
          <table className="legalTable">
            <thead>
              <tr>
                <th>항목</th>
                <th>내용</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>익명 식별자</td>
                <td>이용자 기기에서 무작위 생성되는 문자열 (개인 식별 불가)</td>
              </tr>
              <tr>
                <td>기기 유형</td>
                <td>모바일 / 태블릿 / 데스크톱 구분 값</td>
              </tr>
              <tr>
                <td>이용 기록</td>
                <td>진단 일시, 추천받은 메뉴, 클릭·찜하기·반응 등 상호작용 기록</td>
              </tr>
            </tbody>
          </table>

          <div className="legalNotice">
            <p>
              <strong>익명 식별자에 관하여</strong>
              <br />
              익명 식별자는 이용자의 브라우저 저장소에 보관되는 무작위 문자열로, 이를 통해 특정 개인을 식별할 수 없습니다. 이용자가 브라우저 저장소를 삭제하면 해당 식별자는 소멸하며 이전 기록과의 연결이 끊어집니다.
            </p>
          </div>
        </section>

        <section className="legalSec">
          <h2>제3조 (개인정보의 처리 및 보유 기간)</h2>
          <ol>
            <li>서비스는 수집한 정보를 <strong>수집일로부터 1년간</strong> 보관 후 지체 없이 파기합니다.</li>
            <li>다만, 통계 목적으로 개인을 식별할 수 없도록 가공한 정보는 보유 기간 제한 없이 활용할 수 있습니다.</li>
            <li>관계 법령에 따라 보존이 필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.</li>
          </ol>
        </section>

        <section className="legalSec">
          <h2>제4조 (개인정보의 제3자 제공)</h2>
          <p>서비스는 이용자의 개인정보를 제3자에게 제공하지 않습니다.</p>
          <p>다만, 다음의 경우는 예외로 합니다.</p>
          <ol>
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ol>

          <h3>외부 링크 안내</h3>
          <p>서비스는 추천 결과에서 다음 외부 사이트로 연결되는 링크를 제공합니다.</p>
          <ul>
            <li>레시피 검색: 만개의레시피 (10000recipe.com)</li>
            <li>식당 검색: 네이버 지도 (map.naver.com)</li>
          </ul>
          <div className="legalNotice">
            <p>
              <strong>링크를 클릭하여 외부 사이트로 이동하는 경우, 해당 사이트의 개인정보 처리방침이 적용되며 서비스는 이에 대해 책임지지 않습니다.</strong> 서비스는 위 사이트에 이용자의 개인정보를 제공하지 않습니다.
            </p>
          </div>
        </section>

        <section className="legalSec">
          <h2>제5조 (개인정보 처리의 위탁)</h2>
          <p>서비스는 안정적인 운영을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.</p>
          <table className="legalTable">
            <thead>
              <tr>
                <th>수탁자</th>
                <th>위탁 업무</th>
                <th>관련 정보</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Vercel Inc.</td>
                <td>웹 서비스 호스팅</td>
                <td>미국 소재</td>
              </tr>
              <tr>
                <td>Supabase Inc.</td>
                <td>이용 기록 데이터베이스 운영</td>
                <td>서버 위치: 대한민국(서울)</td>
              </tr>
              <tr>
                <td>Google LLC</td>
                <td>AI 재추천 기능 (Gemini API)</td>
                <td>이용자 입력 문구 및 상태 수치 전송</td>
              </tr>
            </tbody>
          </table>

          <div className="legalNotice">
            <p>
              <strong>국외 이전에 관하여</strong>
              <br />
              위 수탁자 중 일부는 국외에 소재하고 있습니다. 서비스 이용 시 이용자의 정보가 국외 서버로 전송·처리될 수 있으며, 서비스를 이용하는 것으로 이에 동의한 것으로 봅니다. 이전되는 항목은 제2조에 기재된 정보에 한하며, 이전 목적은 제1조의 서비스 제공 목적에 한정됩니다.
            </p>
          </div>

          <div className="legalNotice">
            <p>
              <strong>AI 재추천 기능 이용 시 주의사항</strong>
              <br />
              이용자가 입력한 문구는 추천 조건 분석을 위해 Google Gemini API로 전송됩니다. <strong>개인을 식별할 수 있는 정보(이름, 연락처, 주소 등)를 입력하지 않도록 주의해 주세요.</strong>
            </p>
          </div>
        </section>

        <section className="legalSec">
          <h2>제6조 (이용자의 권리와 행사 방법)</h2>
          <ol>
            <li>이용자는 언제든지 브라우저 저장소(로컬 스토리지)를 삭제하여 익명 식별자와 찜한 메뉴 목록을 삭제할 수 있습니다.</li>
            <li>서비스는 회원가입 절차가 없어 특정 이용자의 기록을 식별·조회할 수 없으므로, 개별 열람·정정·삭제 요청에 응하기 어려울 수 있습니다.</li>
            <li>그 밖의 문의 사항은 제9조의 연락처로 문의해 주시기 바랍니다.</li>
          </ol>
        </section>

        <section className="legalSec">
          <h2>제7조 (만 14세 미만 아동의 개인정보 처리)</h2>
          <p>
            서비스는 만 14세 미만 아동의 이용을 제한합니다. 만 14세 미만 아동은 서비스를 이용할 수 없으며, 서비스는 만 14세 미만 아동의 개인정보를 의도적으로 수집하지 않습니다.
          </p>
        </section>

        <section className="legalSec">
          <h2>제8조 (개인정보의 안전성 확보 조치)</h2>
          <p>서비스는 다음과 같은 조치를 취하고 있습니다.</p>
          <ol>
            <li><strong>관리적 조치</strong> — 개인정보 취급자 최소화</li>
            <li><strong>기술적 조치</strong> — 전송 구간 암호화(HTTPS), 데이터베이스 접근 권한 관리</li>
            <li><strong>물리적 조치</strong> — 클라우드 서비스 제공자의 물리적 보안 정책 준수</li>
          </ol>
        </section>

        <section className="legalSec">
          <h2>제9조 (개인정보 보호책임자)</h2>
          <p>이용자는 서비스 이용 중 발생한 개인정보 관련 문의를 아래로 연락하실 수 있습니다.</p>
          <ul>
            <li><strong>성명:</strong> [ 서비스 운영자 성명 기재 필요 ]</li>
            <li><strong>이메일:</strong> [ 서비스 문의 이메일 기재 필요 ]</li>
          </ul>
          <p>기타 개인정보 침해에 대한 신고나 상담이 필요하신 경우 아래 기관에 문의하실 수 있습니다.</p>
          <ul>
            <li>개인정보침해신고센터 (privacy.kisa.or.kr / 국번없이 118)</li>
            <li>개인정보 분쟁조정위원회 (kopico.go.kr / 1833-6972)</li>
            <li>대검찰청 사이버수사과 (spo.go.kr / 국번없이 1301)</li>
            <li>경찰청 사이버수사국 (ecrm.police.go.kr / 국번없이 182)</li>
          </ul>
        </section>

        <section className="legalSec">
          <h2>제10조 (개인정보 처리방침의 변경)</h2>
          <p>
            이 개인정보 처리방침은 시행일로부터 적용됩니다. 법령·정책 또는 보안 기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 시에는 변경사항의 시행 7일 전부터 서비스 내 공지사항을 통하여 고지합니다.
          </p>
          <p className="legalMeta" style={{ marginTop: "20px" }}>
            공고일자: 2026년 8월 5일
            <br />
            시행일자: 2026년 8월 5일
          </p>
        </section>
      </div>
    </div>
  );
}
