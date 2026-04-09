/**
 * @page /terms
 * @description My Chatbot World 이용약관
 */

export const metadata = {
  title: '이용약관 | My Chatbot World',
  description: 'My Chatbot World 서비스 이용약관',
};

export default function TermsPage() {
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
          이용약관
        </h1>
        <p style={{ fontSize: '15px', color: 'rgb(255 255 255 / 0.7)' }}>
          최종 업데이트: 2026년 4월 8일
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
        <Section title="제1조 (목적)">
          <p>
            이 약관은 My Chatbot World(이하 &quot;회사&quot;)가 운영하는 My Chatbot World 서비스(이하 &quot;서비스&quot;)의
            이용과 관련하여 회사와 이용자의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
        </Section>

        <Section title="제2조 (정의)">
          <p>이 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
          <ol>
            <li>
              <strong>서비스</strong>란 회사가 제공하는 AI 챗봇 생성·관리·배포 플랫폼 및 관련 부가서비스 일체를 말합니다.
            </li>
            <li>
              <strong>이용자</strong>란 이 약관에 동의하고 서비스를 이용하는 회원 및 비회원을 말합니다.
            </li>
            <li>
              <strong>회원</strong>이란 회사에 개인정보를 제공하고 회원 등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며 서비스를 이용할 수 있는 자를 말합니다.
            </li>
            <li>
              <strong>챗봇</strong>이란 회원이 서비스를 통해 생성·배포하는 AI 대화 에이전트를 말합니다.
            </li>
            <li>
              <strong>크레딧</strong>이란 서비스 내에서 챗봇 운영 및 유료 기능 이용에 사용되는 가상 화폐 단위를 말합니다.
            </li>
            <li>
              <strong>스킬</strong>이란 챗봇에 부가할 수 있는 특정 기능 모듈을 말합니다.
            </li>
          </ol>
        </Section>

        <Section title="제3조 (약관의 효력 및 변경)">
          <ol>
            <li>이 약관은 서비스 화면에 게시하거나 기타 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
            <li>
              회사는 합리적인 사유가 발생할 경우 관련 법령에 위배되지 않는 범위에서 이 약관을 변경할 수 있습니다.
            </li>
            <li>
              약관이 변경되는 경우 회사는 변경사항을 시행일 기준 최소 7일 전에 서비스 내 공지사항 또는 이메일을 통해 고지합니다.
            </li>
            <li>
              변경된 약관에 동의하지 않는 회원은 서비스 이용을 중단하고 회원 탈퇴를 요청할 수 있습니다.
              변경 약관 시행 후 계속하여 서비스를 이용하는 경우 변경된 약관에 동의한 것으로 간주됩니다.
            </li>
          </ol>
        </Section>

        <Section title="제4조 (서비스 제공)">
          <ol>
            <li>
              회사는 다음과 같은 서비스를 제공합니다.
              <ul>
                <li>AI 챗봇 생성 및 커스터마이징 기능</li>
                <li>챗봇 배포 및 외부 채널 연동 기능</li>
                <li>챗봇 스킬 마켓플레이스</li>
                <li>챗봇 학습 데이터 관리(위키) 기능</li>
                <li>커뮤니티 및 지식 공유 기능</li>
                <li>수익 창출(스킬 판매, 챗봇 임대 등) 기능</li>
                <li>기타 회사가 정하는 부가서비스</li>
              </ul>
            </li>
            <li>
              서비스는 연중무휴 24시간 제공을 원칙으로 하나, 시스템 정기점검·기술적 문제·기타 불가피한 사유로 일시적으로 중단될 수 있습니다.
            </li>
            <li>
              회사는 서비스의 품질 향상을 위해 사전 고지 후 서비스 내용을 변경하거나 일부를 종료할 수 있습니다.
            </li>
          </ol>
        </Section>

        <Section title="제5조 (회원가입 및 계정)">
          <ol>
            <li>
              이용자는 회사가 정한 양식에 따라 필요한 정보를 기입하고 이 약관에 동의함으로써 회원가입을 신청합니다.
            </li>
            <li>
              회사는 다음 각 호에 해당하는 신청에 대해서는 승낙을 거부하거나 사후에 이용계약을 해지할 수 있습니다.
              <ul>
                <li>타인의 명의를 도용하거나 허위 정보를 기재한 경우</li>
                <li>만 14세 미만인 자가 법정대리인의 동의 없이 신청한 경우</li>
                <li>이전에 약관 위반으로 회원 자격을 상실한 경우</li>
                <li>기타 회사가 정한 기준을 충족하지 못한 경우</li>
              </ul>
            </li>
            <li>회원은 등록한 개인정보가 변경된 경우 즉시 서비스 내에서 수정해야 합니다.</li>
            <li>
              계정 정보(아이디, 비밀번호)는 회원 본인만 사용할 수 있으며, 타인에게 양도·대여·공유할 수 없습니다.
            </li>
            <li>
              회원은 계정 정보 유출·도용·무단 사용이 의심되는 경우 즉시 비밀번호를 변경하고 고객센터에 신고해야 합니다.
            </li>
          </ol>
        </Section>

        <Section title="제6조 (크레딧 및 결제)">
          <ol>
            <li>
              회원은 서비스 내 유료 기능 이용을 위해 크레딧을 구매할 수 있으며, 크레딧은 현금 환불이 불가합니다.
              단, 관계 법령에서 정한 경우는 예외로 합니다.
            </li>
            <li>
              크레딧의 유효기간은 구매일로부터 1년이며, 유효기간 내 미사용 크레딧은 소멸됩니다.
            </li>
            <li>
              결제는 신용카드, 계좌이체(무통장 입금), 기타 회사가 정한 결제 수단을 이용할 수 있습니다.
            </li>
            <li>
              회원이 구매한 크레딧은 &quot;콘텐츠산업진흥법&quot; 및 관련 법령에 따라 구매 후 7일 이내 미사용 시 환불이 가능합니다.
              단, 일부 사용한 경우 잔여분에 대한 환불 정책은 회사 고객센터를 통해 안내합니다.
            </li>
            <li>
              스킬 마켓플레이스에서 판매자로 등록한 회원은 회사가 정한 수수료 정책에 따라 판매 수익을 정산받습니다.
            </li>
          </ol>
        </Section>

        <Section title="제7조 (회원의 의무)">
          <ol>
            <li>회원은 다음 각 호에 해당하는 행위를 해서는 안 됩니다.</li>
            <ul>
              <li>타인의 개인정보, 계정 정보 등을 도용하거나 부정 취득하는 행위</li>
              <li>허위 정보를 게시하거나 타인을 기망하는 행위</li>
              <li>음란·폭력적·혐오적 콘텐츠를 생성·배포하는 챗봇을 운영하는 행위</li>
              <li>회사의 지식재산권 또는 제3자의 권리를 침해하는 행위</li>
              <li>서비스의 정상적인 운영을 방해하는 해킹·DDoS 등의 행위</li>
              <li>관련 법령 및 이 약관에서 금지하는 기타 행위</li>
            </ul>
            <li>
              회원이 위 의무를 위반하는 경우, 회사는 서비스 이용 제한·계정 정지·강제 탈퇴 등의 조치를 취할 수 있습니다.
            </li>
          </ol>
        </Section>

        <Section title="제8조 (회사의 의무)">
          <ol>
            <li>
              회사는 관련 법령 및 이 약관을 준수하며, 지속적이고 안정적인 서비스 제공을 위해 최선을 다합니다.
            </li>
            <li>
              회사는 회원의 개인정보를 &quot;개인정보처리방침&quot;에 따라 안전하게 관리하며, 법령에 정한 경우를 제외하고 제3자에게 제공하지 않습니다.
            </li>
            <li>
              회사는 회원으로부터 서비스 이용과 관련한 불만이 접수되면 신속하게 처리합니다.
            </li>
          </ol>
        </Section>

        <Section title="제9조 (면책조항)">
          <ol>
            <li>
              회사는 천재지변, 전쟁, 테러, 해킹 등 불가항력적 사유로 인한 서비스 중단에 대해 책임지지 않습니다.
            </li>
            <li>
              회원이 게시한 콘텐츠 및 회원 간의 분쟁에 대하여 회사는 개입 의무가 없으며, 이로 인한 손해에 대해 책임지지 않습니다.
            </li>
            <li>
              회원이 제공한 정보의 정확성 및 신뢰성에 대한 책임은 회원 본인에게 있습니다.
            </li>
          </ol>
        </Section>

        <Section title="제10조 (준거법 및 재판관할)">
          <ol>
            <li>이 약관의 해석 및 적용은 대한민국 법령에 따릅니다.</li>
            <li>
              서비스 이용과 관련하여 회사와 회원 사이에 분쟁이 발생하는 경우, 민사소송법에 따른 관할 법원을 제1심 법원으로 합니다.
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
          <p>본 약관은 2026년 4월 8일부터 시행됩니다.</p>
          <p style={{ marginTop: '4px' }}>문의: support@mychatbotworld.com</p>
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
