/**
 * @page /refund
 * @description CoCoBot World 환불정책 및 청약철회 안내 (전자상거래법 제13조·제17조·제18조)
 */

export const metadata = {
  title: '환불정책 | CoCoBot World',
  description: 'CoCoBot World 크레딧 및 유료 서비스 환불정책, 청약철회 안내',
};

export default function RefundPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'rgb(var(--bg-base))',
        color: 'rgb(var(--text-primary-rgb))',
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
          환불정책
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
            color: 'rgb(var(--text-secondary-rgb))',
            marginBottom: '40px',
            padding: '20px 24px',
            background: 'rgb(var(--color-primary) / 0.06)',
            borderLeft: '4px solid rgb(var(--color-primary))',
            borderRadius: '0 8px 8px 0',
          }}
        >
          본 정책은 「전자상거래 등에서의 소비자보호에 관한 법률」(이하 &quot;전상법&quot;) 및
          「콘텐츠산업진흥법」에 따라 CoCoBot World(이하 &quot;회사&quot;)의 유료 서비스 환불 기준을
          정의합니다. 본 정책에 규정되지 않은 사항은 관련 법령 및 공정거래위원회 표준약관을 우선 적용합니다.
        </p>

        <Section title="제1조 (환불 대상)">
          <ol>
            <li>
              회원이 결제한 <strong>크레딧</strong>(유상) 및 <strong>프리미엄 기능 이용료</strong>가 환불 대상입니다.
            </li>
            <li>
              다음 항목은 환불 대상에서 제외됩니다.
              <ul>
                <li>이벤트·프로모션·리퍼럴 등으로 <strong>무상 지급된 크레딧</strong></li>
                <li>AI 응답 생성·TTS·STT 등 <strong>콘텐츠가 즉시 제공·소비된 부분</strong> (전상법 제17조 제2항 제5호)</li>
                <li>회원이 <strong>이용약관을 위반하여 계정 정지된 경우</strong>의 잔여 크레딧</li>
                <li>스킬 마켓플레이스에서 구매한 스킬로서 이미 챗봇에 설치·사용된 항목</li>
              </ul>
            </li>
          </ol>
        </Section>

        <Section title="제2조 (청약철회 기간 및 조건)">
          <Table
            headers={['구분', '환불 기준', '환불 금액']}
            rows={[
              ['구매 후 7일 이내 & 전액 미사용', '전상법 제17조 제1항', '결제액 100%'],
              ['구매 후 7일 이내 & 일부 사용', '미사용 잔여 크레딧 한정', '(잔여크레딧 / 구매크레딧) × 결제액'],
              ['구매 후 7일 초과 & 미사용', '콘텐츠산업진흥법 제28조', '결제액 90% (위약금 10% 공제)'],
              ['구매 후 7일 초과 & 일부 사용', '잔여분 위약금 공제', '잔여분 × 90%'],
              ['유효기간 경과', '소멸된 크레딧', '환불 불가'],
              ['결제 오류·중복 결제', '회사 귀책', '결제액 100% 즉시 환불'],
              ['시스템 장애로 미지급', '회사 귀책', '미지급 크레딧 100% 재지급 또는 환불'],
            ]}
          />
          <p style={{ marginTop: '16px', fontSize: '14px' }}>
            ※ 전상법 제17조 제2항에 따라 <strong>콘텐츠가 즉시 제공·소비된 부분</strong>은 청약철회 제한 사유에 해당합니다.
            단, 회사는 소비자 보호를 위해 7일 이내 미사용분에 대해 관대한 환불 정책을 적용합니다.
          </p>
        </Section>

        <Section title="제3조 (환불 신청 방법)">
          <ol>
            <li>
              <strong>온라인 신청</strong>: 고객센터 페이지(<a href="/support" style={{ color: 'rgb(var(--color-primary))', textDecoration: 'underline' }}>/support</a>)에서 &quot;환불 신청&quot; 선택
            </li>
            <li>
              <strong>이메일 신청</strong>: support@mychatbot.world 로 아래 정보 송부
              <ul>
                <li>회원 이메일 / 결제 일시 / 결제 금액</li>
                <li>환불 사유 (간단히)</li>
                <li>환불 받을 계좌 정보 (무통장 입금 시)</li>
              </ul>
            </li>
            <li>
              회사는 신청 접수 후 <strong>영업일 기준 3일 이내</strong> 심사하여 승인 여부를 회신합니다.
            </li>
          </ol>
        </Section>

        <Section title="제4조 (환불 처리 기간)">
          <Table
            headers={['결제 수단', '환불 소요 시간', '비고']}
            rows={[
              ['신용카드', '3~7 영업일', 'PG사 및 카드사 정책에 따름'],
              ['계좌이체 (무통장)', '영업일 기준 3일 이내', '신청 시 제출한 계좌로 송금'],
              ['간편결제 (카카오페이 등)', '3~5 영업일', '결제사 정책에 따름'],
            ]}
          />
          <p style={{ marginTop: '16px' }}>
            결제 승인 취소가 불가능한 경우(결제일로부터 일정 기간 경과 등)에는 회사가 직접 계좌이체로 환불합니다.
          </p>
        </Section>

        <Section title="제5조 (부분 환불 계산 예시)">
          <div
            style={{
              padding: '20px 24px',
              background: 'rgb(var(--bg-subtle))',
              borderRadius: '8px',
              fontSize: '14px',
              lineHeight: '1.8',
            }}
          >
            <p><strong>예시 1</strong>: 10,000원에 100크레딧 구매 → 30크레딧 사용 → 5일차에 환불 신청</p>
            <p style={{ marginTop: '8px' }}>
              잔여 70크레딧 × (10,000 ÷ 100) = <strong>7,000원 환불</strong>
            </p>
            <p style={{ marginTop: '16px' }}><strong>예시 2</strong>: 10,000원에 100크레딧 구매 → 미사용 → 10일차에 환불 신청</p>
            <p style={{ marginTop: '8px' }}>
              10,000원 × 90% = <strong>9,000원 환불</strong> (위약금 10% 공제)
            </p>
          </div>
        </Section>

        <Section title="제6조 (특수 상황)">
          <ol>
            <li>
              <strong>회원 탈퇴 시</strong>: 탈퇴와 동시에 보유 크레딧은 소멸되며, 환불을 원하는 경우 탈퇴 전 환불 신청 필수.
            </li>
            <li>
              <strong>서비스 종료 시</strong>: 회사가 서비스를 종료하는 경우 종료 30일 전 공지하며, 미사용 유상 크레딧은 전액 환불합니다.
            </li>
            <li>
              <strong>서비스 장애로 이용 불가</strong>: 4시간 이상 지속 장애 발생 시 영향 범위에 따라 크레딧 보상 또는 환불을 진행합니다.
            </li>
          </ol>
        </Section>

        <Section title="제7조 (소비자 분쟁 해결)">
          <ol>
            <li>
              환불 신청이 반려되거나 처리 결과에 이의가 있는 경우 회사 고객센터를 통해 이의 제기할 수 있습니다.
            </li>
            <li>
              분쟁이 원만히 해결되지 않을 경우 다음 기관의 조정을 통해 해결할 수 있습니다.
              <ul>
                <li>공정거래위원회 소비자상담센터 (1372번)</li>
                <li>한국소비자원 (1372 / <a href="https://www.kca.go.kr" target="_blank" rel="noopener" style={{ color: 'rgb(var(--color-primary))' }}>www.kca.go.kr</a>)</li>
                <li>전자거래분쟁조정위원회 (<a href="https://www.ecmc.or.kr" target="_blank" rel="noopener" style={{ color: 'rgb(var(--color-primary))' }}>www.ecmc.or.kr</a>)</li>
              </ul>
            </li>
          </ol>
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
          <p>본 환불정책은 2026년 4월 20일부터 시행됩니다.</p>
          <p style={{ marginTop: '4px' }}>상호: CoCoBot World | 사업자등록번호: (등록 시 기재) | 대표자: (기재)</p>
          <p style={{ marginTop: '4px' }}>통신판매업 신고번호: (신고 후 기재) | 주소: (기재)</p>
          <p style={{ marginTop: '4px' }}>고객센터: <a href="/support" style={{ color: 'rgb(var(--color-primary))' }}>/support</a> | 이메일: support@mychatbot.world</p>
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
          color: 'rgb(var(--text-secondary-rgb))',
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
                    color: 'rgb(var(--text-secondary-rgb))',
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
