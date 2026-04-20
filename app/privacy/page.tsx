/**
 * @page /privacy
 * @description CoCoBot World 개인정보처리방침
 */

export const metadata = {
  title: '개인정보처리방침 | CoCoBot World',
  description: 'CoCoBot World 개인정보처리방침',
};

export default function PrivacyPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'rgb(var(--bg-base))',
        color: 'rgb(var(--text-primary))',
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgb(var(--primary-900)), rgb(var(--primary-950, 13 6 56)))',
          paddingTop: '64px',
          paddingBottom: '64px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '12px',
          }}
        >
          개인정보처리방침
        </h1>
        <p style={{ fontSize: '15px', color: 'rgb(255 255 255 / 0.7)' }}>
          최종 업데이트: 2026년 4월 20일
        </p>
      </div>

      {/* 본문 */}
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '60px 24px 80px',
        }}
      >
        <p
          style={{
            fontSize: '15px',
            lineHeight: '1.9',
            color: 'rgb(var(--text-secondary))',
            marginBottom: '40px',
            padding: '20px 24px',
            background: 'rgb(var(--color-primary) / 0.06)',
            borderLeft: '4px solid rgb(var(--color-primary))',
            borderRadius: '0 8px 8px 0',
          }}
        >
          CoCoBot World(이하 &quot;회사&quot;)는 이용자의 개인정보를 소중히 여기며, 「개인정보 보호법」 및 관련 법령을 준수합니다.
          이 방침을 통해 회사가 수집하는 개인정보의 항목, 이용 목적, 보유 기간 및 이용자의 권리를 안내합니다.
        </p>

        <Section title="제1조 (개인정보 수집 및 이용 목적)">
          <p>회사는 다음의 목적을 위해 개인정보를 수집·이용합니다.</p>
          <Table
            headers={['목적', '상세 내용']}
            rows={[
              ['회원가입 및 관리', '회원 식별, 본인 확인, 서비스 부정이용 방지, 각종 고지 및 통지'],
              ['서비스 제공', 'AI 챗봇 생성·배포·관리, 스킬 마켓플레이스 운영, 학습 데이터 관리'],
              ['결제 및 정산', '크레딧 구매, 유료 서비스 결제, 스킬 판매 수익 정산'],
              ['고객 지원', '문의·민원 접수 및 처리, 분쟁 해결'],
              ['서비스 개선', '서비스 이용 통계 분석, 신규 기능 개발, 이용 환경 개선'],
              ['마케팅 및 광고', '이벤트·혜택 안내 (별도 동의한 경우에 한함)'],
            ]}
          />
        </Section>

        <Section title="제2조 (수집하는 개인정보 항목)">
          <p>회사는 서비스 제공을 위해 다음과 같이 개인정보를 수집합니다.</p>
          <Table
            headers={['구분', '수집 항목', '수집 방법']}
            rows={[
              ['회원가입 (필수)', '이메일 주소, 비밀번호, 닉네임', '서비스 가입 양식'],
              ['회원가입 (선택)', '프로필 이미지, 소개글', '마이페이지 설정'],
              ['소셜 로그인', 'OAuth 제공 이메일, 이름, 프로필 이미지', 'Google/카카오 등 OAuth'],
              ['결제 정보', '결제 수단 정보 (카드번호 미저장, PG사 처리)', '결제 시 자동 수집'],
              ['서비스 이용', '접속 로그, IP, 브라우저 정보, 쿠키, 챗봇 이용 기록', '서비스 이용 시 자동 수집'],
              ['고객 문의', '이름, 이메일, 연락처, 문의 내용', '고객센터 문의 양식'],
            ]}
          />
          <p style={{ marginTop: '16px' }}>
            만 14세 미만 아동의 개인정보는 법정대리인의 동의를 받은 경우에만 수집합니다.
          </p>
        </Section>

        <Section title="제3조 (개인정보 보유 및 이용 기간)">
          <ol>
            <li>
              회사는 이용자의 개인정보를 회원 탈퇴 시까지 보유하며, 탈퇴 후 즉시 파기합니다.
              단, 다음 각 호에 해당하는 경우 해당 기간 동안 보유합니다.
            </li>
          </ol>
          <Table
            headers={['보유 근거', '보유 항목', '보유 기간']}
            rows={[
              ['전자상거래법', '계약·청약철회 기록, 결제 및 공급 기록', '5년'],
              ['전자상거래법', '소비자 불만·분쟁처리 기록', '3년'],
              ['통신비밀보호법', '접속 로그, IP 주소', '3개월'],
              ['회사 내부 방침', '부정이용 방지를 위한 이용 제재 기록', '1년'],
            ]}
          />
          <p style={{ marginTop: '16px' }}>
            보유 기간이 경과한 개인정보는 지체 없이 파기합니다. 전자적 파일은 복구 불가능한 방법으로 삭제하며,
            종이 문서는 분쇄 또는 소각합니다.
          </p>
        </Section>

        <Section title="제4조 (개인정보의 제3자 제공)">
          <ol>
            <li>
              회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
              단, 다음의 경우에는 예외로 합니다.
            </li>
            <ul>
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 따라 수사 기관 등이 요청하는 경우</li>
            </ul>
          </ol>
        </Section>

        <Section title="제5조 (개인정보 처리 위탁)">
          <p>회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다.</p>
          <Table
            headers={['수탁 업체', '위탁 업무', '보유 기간']}
            rows={[
              ['Supabase Inc. (미국)', '데이터베이스 호스팅 및 인증(Auth) 서비스', '서비스 이용 기간'],
              ['Vercel Inc. (미국)', '웹 서비스 호스팅 및 배포', '서비스 이용 기간'],
              ['OpenRouter (미국)', 'AI 모델 응답 생성 (대화 내용 익명 전달, 프로필 미전송)', '요청 처리 시점 한정'],
              ['Upstash Inc. (미국)', 'Redis 캐시 및 레이트 리밋 (IP/식별자만)', '최대 24시간'],
              ['결제 대행사 (PG사)', '결제 처리 및 무통장 입금 확인', '관련 법령에 따름'],
            ]}
          />
          <p style={{ marginTop: '16px', fontSize: '13px' }}>
            위 수탁사 중 일부는 미국 등 해외에 소재합니다. 개인정보는 암호화 전송되며,
            각 수탁사는 GDPR/SOC 2 등 국제 표준 보안 요건을 준수합니다.
            국외 이전을 원치 않는 이용자는 고객센터를 통해 탈퇴를 요청할 수 있습니다.
          </p>
        </Section>

        <Section title="제6조 (이용자의 권리와 행사 방법)">
          <ol>
            <li>
              이용자는 언제든지 다음의 권리를 행사할 수 있습니다.
              <ul>
                <li>개인정보 열람 요청</li>
                <li>오류 정정 요청</li>
                <li>삭제 요청</li>
                <li>처리 정지 요청</li>
              </ul>
            </li>
            <li>
              위 권리는 서비스 내 &quot;마이페이지 &gt; 계정 설정&quot; 또는 고객센터(support@mychatbotworld.com)를 통해 행사할 수 있습니다.
            </li>
            <li>
              권리 행사는 이용자의 법정대리인이나 위임받은 자도 할 수 있으며,
              이 경우 위임장을 제출하여야 합니다.
            </li>
          </ol>
        </Section>

        <Section title="제7조 (쿠키 및 자동 수집 정보)">
          <ol>
            <li>
              회사는 서비스 운영을 위해 쿠키(Cookie)를 사용합니다.
              쿠키는 이용자의 환경 설정, 로그인 상태 유지, 서비스 이용 분석 등에 활용됩니다.
            </li>
            <li>
              이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 일부 서비스 이용이 제한될 수 있습니다.
            </li>
          </ol>
        </Section>

        <Section title="제8조 (개인정보 보호 책임자)">
          <p>회사는 개인정보 관련 민원을 신속하게 처리하기 위해 아래와 같이 개인정보 보호 책임자를 지정하고 있습니다.</p>
          <div
            style={{
              marginTop: '12px',
              padding: '20px 24px',
              background: 'rgb(var(--bg-subtle))',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            <p><strong>개인정보 보호 책임자</strong></p>
            <p style={{ marginTop: '8px' }}>성명: (대표자명 기재)</p>
            <p>직책: 대표</p>
            <p>이메일: privacy@mychatbot.world</p>
            <p>고객센터: <a href="/support" style={{ color: 'rgb(var(--color-primary))' }}>/support</a></p>
          </div>
          <p style={{ marginTop: '16px' }}>
            기타 개인정보 침해에 관한 신고·상담은 개인정보보호위원회(privacy.go.kr), 한국인터넷진흥원
            개인정보침해신고센터(118)로 문의하실 수 있습니다.
          </p>
        </Section>

        <div
          style={{
            marginTop: '48px',
            paddingTop: '24px',
            borderTop: '1px solid rgb(var(--text-muted) / 0.2)',
            fontSize: '13px',
            color: 'rgb(var(--text-muted))',
          }}
        >
          <p>본 방침은 2026년 4월 20일부터 시행됩니다.</p>
          <p style={{ marginTop: '4px' }}>이전 방침 시행일: 2026년 4월 8일</p>
          <p style={{ marginTop: '4px' }}>문의: privacy@mychatbot.world</p>
        </div>
      </div>
    </div>
  );
}

/* ── 섹션 컴포넌트 ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '40px' }}>
      <h2
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: 'rgb(var(--color-primary))',
          marginBottom: '16px',
          paddingBottom: '10px',
          borderBottom: '2px solid rgb(var(--color-primary) / 0.2)',
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontSize: '15px',
          lineHeight: '1.9',
          color: 'rgb(var(--text-secondary))',
        }}
      >
        {children}
      </div>
    </section>
  );
}

/* ── 테이블 컴포넌트 ── */
function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto', marginTop: '16px' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
        }}
      >
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  padding: '10px 14px',
                  background: 'rgb(var(--color-primary) / 0.1)',
                  color: 'rgb(var(--color-primary))',
                  fontWeight: 600,
                  textAlign: 'left',
                  border: '1px solid rgb(var(--text-muted) / 0.15)',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{
                    padding: '10px 14px',
                    border: '1px solid rgb(var(--text-muted) / 0.15)',
                    color: 'rgb(var(--text-secondary))',
                    lineHeight: '1.6',
                    verticalAlign: 'top',
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
