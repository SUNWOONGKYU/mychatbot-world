/**
 * @task S5S2
 * @description 보안 취약점 신고 정책 페이지
 */

export const metadata = {
  title: '보안 정책 | My Chatbot World',
  description: 'My Chatbot World 보안 취약점 신고 정책 및 책임 공개 프로그램',
};

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-900 to-primary-950 py-16 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">보안 정책</h1>
        <p className="text-primary-200 text-lg">Security Policy &amp; Responsible Disclosure</p>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">

        {/* Contact */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">취약점 신고 방법</h2>
          <p className="text-text-secondary mb-3">
            보안 취약점을 발견하셨다면 아래 이메일로 신고해 주세요.
            공개 이슈 트래커나 SNS를 통한 신고는 삼가 주시기 바랍니다.
          </p>
          <div className="rounded-xl bg-bg-subtle border border-border-default p-5">
            <p className="font-medium">보안 문의 이메일</p>
            <a
              href="mailto:security@mychatbotworld.com"
              className="text-primary-400 hover:underline text-lg mt-1 block"
            >
              security@mychatbotworld.com
            </a>
          </div>
        </section>

        {/* Scope */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">신고 범위</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-bg-subtle border border-border-default p-5">
              <h3 className="font-semibold text-success mb-3">✅ 대상 (In-Scope)</h3>
              <ul className="text-text-secondary space-y-1 text-sm">
                <li>• mychatbotworld.com 웹 애플리케이션</li>
                <li>• API 엔드포인트 (/api/*)</li>
                <li>• 인증 및 세션 관리</li>
                <li>• 데이터 접근 제어 (RLS)</li>
                <li>• XSS, SQL Injection, CSRF</li>
              </ul>
            </div>
            <div className="rounded-xl bg-bg-subtle border border-border-default p-5">
              <h3 className="font-semibold text-error mb-3">❌ 제외 (Out-of-Scope)</h3>
              <ul className="text-text-secondary space-y-1 text-sm">
                <li>• DoS / DDoS 공격</li>
                <li>• 소셜 엔지니어링</li>
                <li>• 물리적 공격</li>
                <li>• 제3자 서비스 취약점</li>
                <li>• 자동화 스캔 결과만의 신고</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Process */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">처리 절차</h2>
          <ol className="space-y-3 text-text-secondary">
            {[
              ['접수 확인', '신고 수신 후 3영업일 이내 확인 이메일 발송'],
              ['검토', '7영업일 이내 취약점 유효성 검토'],
              ['수정', '심각도에 따라 Critical 72시간, High 7일, Medium 30일 이내 수정'],
              ['공개', '수정 완료 후 신고자 동의 하에 보안 고지 공개'],
            ].map(([step, desc], i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white text-sm flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <div>
                  <span className="font-medium text-text-primary">{step}</span>
                  <span className="text-text-muted"> — {desc}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* security.txt */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Security.txt</h2>
          <p className="text-text-secondary text-sm">
            RFC 9116 표준을 준수하는{' '}
            <a href="/.well-known/security.txt" className="text-primary-400 hover:underline">
              /.well-known/security.txt
            </a>
            을 통해 자동화 도구에서도 신고 채널을 확인할 수 있습니다.
          </p>
        </section>

        <p className="text-text-muted text-xs text-right">
          최종 업데이트: 2026-04-12
        </p>
      </div>
    </div>
  );
}
