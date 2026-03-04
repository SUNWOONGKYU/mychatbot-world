# Task Instruction - S4F3

---

## 📌 필수 참조 규칙 파일 (2025-12-19)

> **⚠️ 작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |



## Task ID
S4F3

## Task Name
크레딧 충전 UI

## Task Goal
충전 금액 선택, 결제 수단 선택, 결제 진행 페이지 구현

## Prerequisites (Dependencies)
- S4BA4 (크레딧 충전 API) 완료

## Specific Instructions

### 1. 크레딧 충전 페이지
- 위치: `P3_프로토타입_제작/Frontend/Prototype/pages/subscription/credit-purchase.html`

```html
<!-- pages/subscription/credit-purchase.html -->
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>크레딧 충전 - SSALWorks</title>
    <link rel="stylesheet" href="../../shared.css">
    <link rel="stylesheet" href="../../credit-purchase.css">
    <script src="https://js.tosspayments.com/v1/payment"></script>
</head>
<body>
    <nav class="top-nav">
        <!-- 네비게이션 -->
    </nav>

    <main class="purchase-container">
        <div class="purchase-header">
            <h1>크레딧 충전</h1>
            <p>AI 서비스 이용을 위한 크레딧을 충전하세요</p>
        </div>

        <!-- 현재 크레딧 -->
        <div class="current-credit">
            <span class="label">보유 크레딧</span>
            <span class="amount" id="current-credit">0</span>
        </div>

        <!-- 패키지 선택 -->
        <section class="package-section">
            <h2>충전 패키지 선택</h2>
            <div class="package-list" id="package-list">
                <!-- 동적 로드 -->
            </div>
        </section>

        <!-- 결제 수단 -->
        <section class="payment-section">
            <h2>결제 수단</h2>
            <div id="payment-widget"></div>
            <div id="agreement-widget"></div>
        </section>

        <!-- 결제 요약 -->
        <section class="summary-section">
            <h2>결제 정보</h2>
            <div class="summary-row">
                <span>선택 패키지</span>
                <span id="selected-package-name">-</span>
            </div>
            <div class="summary-row">
                <span>기본 크레딧</span>
                <span id="base-credits">0</span>
            </div>
            <div class="summary-row bonus">
                <span>보너스 크레딧</span>
                <span id="bonus-credits">+0</span>
            </div>
            <div class="summary-row total-credits">
                <span>총 충전 크레딧</span>
                <span id="total-credits">0</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-row total">
                <span>결제 금액</span>
                <span id="total-amount">₩0</span>
            </div>
        </section>

        <!-- 결제 버튼 -->
        <button id="pay-button" class="btn-pay" disabled>
            <span>결제하기</span>
        </button>
    </main>

    <script type="module" src="../../credit-purchase.js"></script>
</body>
</html>
```

### 2. 크레딧 충전 JavaScript
- 위치: `P3_프로토타입_제작/Frontend/Prototype/credit-purchase.js`

```javascript
// credit-purchase.js
/**
 * @task S4F3
 * 크레딧 충전 페이지 로직
 */

let selectedPackage = null;
let paymentWidget = null;
const TOSS_CLIENT_KEY = 'test_ck_xxx'; // 환경변수로 관리

document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentCredit();
    await loadPackages();
    await initPaymentWidget();
});

async function loadCurrentCredit() {
    try {
        const response = await fetch('/api/credit/balance', {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const data = await response.json();
        document.getElementById('current-credit').textContent =
            (data.credit || 0).toLocaleString();
    } catch (error) {
        console.error('Credit load error:', error);
    }
}

async function loadPackages() {
    try {
        const response = await fetch('/api/credit/packages');
        const data = await response.json();

        const container = document.getElementById('package-list');
        container.innerHTML = data.packages.map(pkg => `
            <div class="package-card ${pkg.recommended ? 'recommended' : ''}"
                 data-package-id="${pkg.id}"
                 onclick="selectPackage('${pkg.id}')">
                ${pkg.recommended ? '<span class="badge">인기</span>' : ''}
                <h3>${pkg.name}</h3>
                <div class="credits">
                    <span class="base">${pkg.credits.toLocaleString()}</span>
                    ${pkg.bonus > 0 ? `<span class="bonus">+${pkg.bonus.toLocaleString()}</span>` : ''}
                </div>
                <div class="price">${pkg.price.toLocaleString()}원</div>
                <div class="per-credit">${pkg.pricePerCredit}원/크레딧</div>
                <p class="description">${pkg.description}</p>
            </div>
        `).join('');

        // 패키지 데이터 저장
        window.packagesData = data.packages;
    } catch (error) {
        console.error('Package load error:', error);
    }
}

async function initPaymentWidget() {
    const customerKey = await getCustomerKey();

    paymentWidget = PaymentWidget(TOSS_CLIENT_KEY, customerKey);

    // 결제 위젯 렌더링 (초기 금액 0)
    paymentWidget.renderPaymentMethods('#payment-widget', { value: 0 });
    paymentWidget.renderAgreement('#agreement-widget');
}

function selectPackage(packageId) {
    // 이전 선택 해제
    document.querySelectorAll('.package-card').forEach(card => {
        card.classList.remove('selected');
    });

    // 새 선택
    const card = document.querySelector(`[data-package-id="${packageId}"]`);
    card.classList.add('selected');

    selectedPackage = window.packagesData.find(p => p.id === packageId);

    // 요약 업데이트
    updateSummary();

    // 결제 위젯 금액 업데이트
    paymentWidget.updateAmount(selectedPackage.price);

    // 결제 버튼 활성화
    document.getElementById('pay-button').disabled = false;
}

function updateSummary() {
    if (!selectedPackage) return;

    document.getElementById('selected-package-name').textContent = selectedPackage.name;
    document.getElementById('base-credits').textContent =
        selectedPackage.credits.toLocaleString();
    document.getElementById('bonus-credits').textContent =
        `+${selectedPackage.bonus.toLocaleString()}`;
    document.getElementById('total-credits').textContent =
        selectedPackage.totalCredits.toLocaleString();
    document.getElementById('total-amount').textContent =
        `₩${selectedPackage.price.toLocaleString()}`;
}

document.getElementById('pay-button').addEventListener('click', async () => {
    if (!selectedPackage) {
        alert('패키지를 선택해주세요');
        return;
    }

    const orderId = generateOrderId();

    try {
        await paymentWidget.requestPayment({
            orderId,
            orderName: `SSALWorks 크레딧 ${selectedPackage.name}`,
            successUrl: `${window.location.origin}/pages/subscription/credit-success.html?packageId=${selectedPackage.id}`,
            failUrl: `${window.location.origin}/pages/subscription/credit-fail.html`,
            customerEmail: getUserEmail(),
            customerName: getUserName()
        });
    } catch (error) {
        console.error('Payment request error:', error);
        alert('결제 요청 중 오류가 발생했습니다');
    }
});

function generateOrderId() {
    return `CREDIT_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

async function getCustomerKey() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || `guest_${Date.now()}`;
}

function getAccessToken() {
    return localStorage.getItem('accessToken') || '';
}

function getUserEmail() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.email || '';
}

function getUserName() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.name || '';
}
```

### 3. 크레딧 충전 CSS
- 위치: `P3_프로토타입_제작/Frontend/Prototype/credit-purchase.css`

```css
/* credit-purchase.css */
/**
 * @task S4F3
 */

.purchase-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
}

.purchase-header {
    text-align: center;
    margin-bottom: 2rem;
}

.current-credit {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1.5rem 2rem;
    border-radius: 12px;
    margin-bottom: 2rem;
}

.current-credit .label {
    font-size: 1rem;
}

.current-credit .amount {
    font-size: 2rem;
    font-weight: 700;
}

/* 패키지 카드 */
.package-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
    margin: 1.5rem 0;
}

.package-card {
    position: relative;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
}

.package-card:hover {
    border-color: #3182ce;
    transform: translateY(-2px);
}

.package-card.selected {
    border-color: #3182ce;
    background: #ebf8ff;
}

.package-card.recommended {
    border-color: #48bb78;
}

.package-card .badge {
    position: absolute;
    top: -10px;
    right: 20px;
    background: #48bb78;
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
}

.package-card h3 {
    margin: 0 0 1rem;
    font-size: 1.25rem;
}

.package-card .credits {
    margin-bottom: 0.5rem;
}

.package-card .credits .base {
    font-size: 2rem;
    font-weight: 700;
    color: #2d3748;
}

.package-card .credits .bonus {
    color: #48bb78;
    font-weight: 600;
    margin-left: 0.5rem;
}

.package-card .price {
    font-size: 1.5rem;
    font-weight: 600;
    color: #3182ce;
    margin-bottom: 0.25rem;
}

.package-card .per-credit {
    font-size: 0.85rem;
    color: #718096;
    margin-bottom: 1rem;
}

.package-card .description {
    font-size: 0.9rem;
    color: #718096;
    margin: 0;
}

/* 결제 요약 */
.summary-section {
    background: #f7fafc;
    border-radius: 12px;
    padding: 1.5rem;
    margin: 2rem 0;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
}

.summary-row.bonus span:last-child {
    color: #48bb78;
}

.summary-row.total-credits {
    font-weight: 600;
}

.summary-divider {
    border-top: 1px solid #e2e8f0;
    margin: 0.5rem 0;
}

.summary-row.total {
    font-size: 1.25rem;
    font-weight: 700;
}

.summary-row.total span:last-child {
    color: #3182ce;
}

/* 결제 버튼 */
.btn-pay {
    width: 100%;
    padding: 1rem;
    background: #3182ce;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.btn-pay:hover:not(:disabled) {
    background: #2c5282;
}

.btn-pay:disabled {
    background: #a0aec0;
    cursor: not-allowed;
}
```

### 4. 크레딧 충전 성공 페이지
- 위치: `P3_프로토타입_제작/Frontend/Prototype/pages/subscription/credit-success.html`

(결제 성공 후 API 호출하여 크레딧 충전 완료 처리)

## Expected Output Files
- `P3_프로토타입_제작/Frontend/Prototype/pages/subscription/credit-purchase.html`
- `P3_프로토타입_제작/Frontend/Prototype/credit-purchase.js`
- `P3_프로토타입_제작/Frontend/Prototype/credit-purchase.css`
- `P3_프로토타입_제작/Frontend/Prototype/pages/subscription/credit-success.html`

## Completion Criteria
- [ ] 패키지 선택 UI (3종: 베이직, 스탠다드, 프리미엄)
- [ ] 현재 크레딧 잔액 표시
- [ ] 토스페이먼츠 위젯 연동
- [ ] 결제 요약 정보 표시
- [ ] 결제 성공/실패 처리
- [ ] 반응형 디자인

## Tech Stack
- HTML/CSS/JavaScript
- 토스페이먼츠 SDK

## Task Agent
`frontend-developer`

## Verification Agent
`code-reviewer`

## Tools
- S4BA4 (크레딧 충전 API) 연동

## Execution Type
AI-Only

## Remarks
- 패키지별 보너스 크레딧 강조
- 인기 패키지 배지 표시
- 크레딧당 가격 비교 표시

---

## ⚠️ 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- 예: S1S1 → `S1_개발_준비/Security/`
- 예: S2F1 → `S2_개발-1차/Frontend/`

### 제2 규칙: Production 코드는 이중 저장
- Frontend, Database, Backend_APIs 코드는 Stage 폴더 + Production 폴더 둘 다 저장
- 문서(Documentation, Security, Testing, DevOps)는 Stage 폴더에만 저장

**Area 폴더 매핑:** M→Documentation, F→Frontend, BI→Backend_Infra, BA→Backend_APIs, D→Database, S→Security, T→Testing, O→DevOps, E→External, C→Content
