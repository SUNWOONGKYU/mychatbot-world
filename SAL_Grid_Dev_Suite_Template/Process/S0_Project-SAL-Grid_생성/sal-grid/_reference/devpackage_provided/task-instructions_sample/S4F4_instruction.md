# Task Instruction - S4F4

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
S4F4

## Task Name
결제 수단 등록 UI

## Task Goal
카드/계좌 정보 입력 및 빌링키 발급을 위한 결제 수단 등록 페이지 구현

## Prerequisites (Dependencies)
- S4BA3 (결제 수단 등록 API) 완료

## Specific Instructions

### 1. 결제 수단 관리 페이지
- 위치: `P3_프로토타입_제작/Frontend/Prototype/pages/mypage/payment-methods.html`

```html
<!-- pages/mypage/payment-methods.html -->
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>결제 수단 관리 - SSALWorks</title>
    <link rel="stylesheet" href="../../shared.css">
    <link rel="stylesheet" href="../../payment-methods.css">
</head>
<body>
    <nav class="top-nav">
        <!-- 네비게이션 -->
    </nav>

    <main class="payment-methods-container">
        <div class="page-header">
            <h1>결제 수단 관리</h1>
            <p>등록된 결제 수단을 확인하고 관리하세요</p>
        </div>

        <!-- 등록된 결제 수단 목록 -->
        <section class="methods-list-section">
            <div class="section-header">
                <h2>등록된 결제 수단</h2>
                <button class="btn-add" onclick="openAddModal()">
                    + 새 결제 수단 등록
                </button>
            </div>

            <div id="methods-list" class="methods-list">
                <!-- 동적 로드 -->
                <div class="empty-state" id="empty-state">
                    <div class="empty-icon">💳</div>
                    <p>등록된 결제 수단이 없습니다</p>
                    <button class="btn-primary" onclick="openAddModal()">
                        결제 수단 등록하기
                    </button>
                </div>
            </div>
        </section>

        <!-- 안내 사항 -->
        <section class="info-section">
            <h3>안내 사항</h3>
            <ul>
                <li>기본 결제 수단으로 정기 결제가 진행됩니다</li>
                <li>카드 정보는 토스페이먼츠에서 안전하게 관리됩니다</li>
                <li>결제 수단 삭제 시 진행 중인 정기 결제에 영향을 줄 수 있습니다</li>
            </ul>
        </section>
    </main>

    <!-- 결제 수단 등록 모달 -->
    <div id="add-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>새 결제 수단 등록</h2>
                <button class="btn-close" onclick="closeAddModal()">×</button>
            </div>
            <div class="modal-body">
                <p class="modal-description">
                    카드 정보를 등록하면 크레딧 충전 및 정기 결제에 사용할 수 있습니다.
                </p>
                <div id="card-widget"></div>
                <div id="agreement-widget"></div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary" onclick="closeAddModal()">취소</button>
                <button class="btn-primary" id="register-btn" onclick="registerCard()">
                    등록하기
                </button>
            </div>
        </div>
    </div>

    <script src="https://js.tosspayments.com/v1/payment-widget"></script>
    <script type="module" src="../../payment-methods.js"></script>
</body>
</html>
```

### 2. 결제 수단 관리 JavaScript
- 위치: `P3_프로토타입_제작/Frontend/Prototype/payment-methods.js`

```javascript
// payment-methods.js
/**
 * @task S4F4
 * 결제 수단 관리 페이지 로직
 */

let paymentWidget = null;
const TOSS_CLIENT_KEY = 'test_ck_xxx';

document.addEventListener('DOMContentLoaded', async () => {
    await loadPaymentMethods();
});

async function loadPaymentMethods() {
    const listContainer = document.getElementById('methods-list');
    const emptyState = document.getElementById('empty-state');

    try {
        const response = await fetch('/api/subscription/payment-method', {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });

        const data = await response.json();

        if (!data.paymentMethods || data.paymentMethods.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        // 기존 카드 표시
        const existingCards = listContainer.querySelectorAll('.method-card');
        existingCards.forEach(card => card.remove());

        data.paymentMethods.forEach(method => {
            const card = createMethodCard(method);
            listContainer.insertBefore(card, emptyState);
        });

    } catch (error) {
        console.error('Load payment methods error:', error);
    }
}

function createMethodCard(method) {
    const card = document.createElement('div');
    card.className = `method-card ${method.isDefault ? 'default' : ''}`;
    card.innerHTML = `
        <div class="card-icon">${getCardIcon(method.cardCompany)}</div>
        <div class="card-info">
            <div class="card-company">${method.cardCompany || '카드'}</div>
            <div class="card-number">${method.cardNumber}</div>
            <div class="card-type">${method.cardType || ''}</div>
        </div>
        ${method.isDefault ? '<span class="default-badge">기본</span>' : ''}
        <div class="card-actions">
            ${!method.isDefault ? `
                <button class="btn-set-default" onclick="setDefault('${method.id}')">
                    기본으로 설정
                </button>
            ` : ''}
            <button class="btn-delete" onclick="deleteMethod('${method.id}')">
                삭제
            </button>
        </div>
    `;
    return card;
}

function getCardIcon(company) {
    const icons = {
        '신한': '💳',
        '삼성': '💳',
        '현대': '💳',
        '국민': '💳',
        '롯데': '💳',
        '하나': '💳',
        'BC': '💳'
    };
    return icons[company] || '💳';
}

async function openAddModal() {
    const modal = document.getElementById('add-modal');
    modal.classList.add('active');

    // 결제 위젯 초기화
    if (!paymentWidget) {
        const customerKey = await getCustomerKey();
        paymentWidget = PaymentWidget(TOSS_CLIENT_KEY, customerKey);
    }

    // 카드 등록용 위젯 (금액 0원)
    paymentWidget.renderPaymentMethods('#card-widget', {
        value: 0,
        variantKey: 'BILLING' // 빌링키 발급용
    });
    paymentWidget.renderAgreement('#agreement-widget');
}

function closeAddModal() {
    const modal = document.getElementById('add-modal');
    modal.classList.remove('active');
}

async function registerCard() {
    const registerBtn = document.getElementById('register-btn');
    registerBtn.disabled = true;
    registerBtn.textContent = '처리 중...';

    try {
        const orderId = `BILLING_${Date.now()}`;

        await paymentWidget.requestPayment({
            orderId,
            orderName: 'SSALWorks 결제 수단 등록',
            successUrl: `${window.location.origin}/api/subscription/billing-callback`,
            failUrl: `${window.location.origin}/pages/mypage/billing-fail.html`
        });

    } catch (error) {
        console.error('Card registration error:', error);
        alert('결제 수단 등록에 실패했습니다: ' + error.message);
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = '등록하기';
    }
}

async function setDefault(methodId) {
    if (!confirm('이 카드를 기본 결제 수단으로 설정하시겠습니까?')) return;

    try {
        const response = await fetch('/api/subscription/payment-method/default', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
            },
            body: JSON.stringify({ id: methodId })
        });

        if (response.ok) {
            await loadPaymentMethods();
        } else {
            const data = await response.json();
            alert(data.error || '설정에 실패했습니다');
        }
    } catch (error) {
        console.error('Set default error:', error);
        alert('오류가 발생했습니다');
    }
}

async function deleteMethod(methodId) {
    if (!confirm('이 결제 수단을 삭제하시겠습니까?')) return;

    try {
        const response = await fetch(`/api/subscription/payment-method?id=${methodId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });

        if (response.ok) {
            await loadPaymentMethods();
        } else {
            const data = await response.json();
            alert(data.error || '삭제에 실패했습니다');
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('오류가 발생했습니다');
    }
}

async function getCustomerKey() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || `guest_${Date.now()}`;
}

function getAccessToken() {
    return localStorage.getItem('accessToken') || '';
}
```

### 3. 결제 수단 관리 CSS
- 위치: `P3_프로토타입_제작/Frontend/Prototype/payment-methods.css`

```css
/* payment-methods.css */
/**
 * @task S4F4
 */

.payment-methods-container {
    max-width: 700px;
    margin: 0 auto;
    padding: 2rem;
}

.page-header {
    margin-bottom: 2rem;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.btn-add {
    padding: 0.75rem 1.25rem;
    background: #3182ce;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
}

/* 결제 수단 목록 */
.methods-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.method-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    transition: all 0.2s;
}

.method-card.default {
    border-color: #3182ce;
    background: #ebf8ff;
}

.card-icon {
    font-size: 2rem;
}

.card-info {
    flex: 1;
}

.card-company {
    font-weight: 600;
    margin-bottom: 0.25rem;
}

.card-number {
    color: #4a5568;
    font-family: monospace;
}

.card-type {
    font-size: 0.85rem;
    color: #718096;
}

.default-badge {
    padding: 0.25rem 0.75rem;
    background: #3182ce;
    color: white;
    border-radius: 20px;
    font-size: 0.8rem;
}

.card-actions {
    display: flex;
    gap: 0.5rem;
}

.btn-set-default, .btn-delete {
    padding: 0.5rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    font-size: 0.85rem;
}

.btn-delete {
    color: #e53e3e;
}

/* Empty State */
.empty-state {
    text-align: center;
    padding: 3rem;
    background: #f7fafc;
    border-radius: 12px;
}

.empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

/* 모달 */
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal.active {
    display: flex;
}

.modal-content {
    background: white;
    border-radius: 16px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
}

.btn-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #718096;
}

.modal-body {
    padding: 1.5rem;
}

.modal-description {
    color: #718096;
    margin-bottom: 1.5rem;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1.5rem;
    border-top: 1px solid #e2e8f0;
}

.btn-primary, .btn-secondary {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
}

.btn-primary {
    background: #3182ce;
    color: white;
    border: none;
}

.btn-secondary {
    background: white;
    border: 1px solid #e2e8f0;
}

/* 안내 섹션 */
.info-section {
    margin-top: 2rem;
    padding: 1.5rem;
    background: #fffbeb;
    border-radius: 12px;
}

.info-section h3 {
    margin: 0 0 1rem;
    color: #92400e;
}

.info-section ul {
    margin: 0;
    padding-left: 1.25rem;
    color: #78350f;
}

.info-section li {
    margin-bottom: 0.5rem;
}
```

## Expected Output Files
- `P3_프로토타입_제작/Frontend/Prototype/pages/mypage/payment-methods.html`
- `P3_프로토타입_제작/Frontend/Prototype/payment-methods.js`
- `P3_프로토타입_제작/Frontend/Prototype/payment-methods.css`

## Completion Criteria
- [ ] 등록된 결제 수단 목록 표시
- [ ] 새 결제 수단 등록 모달
- [ ] 토스페이먼츠 빌링 위젯 연동
- [ ] 기본 결제 수단 설정 기능
- [ ] 결제 수단 삭제 기능
- [ ] 빈 상태 UI
- [ ] 반응형 디자인

## Tech Stack
- HTML/CSS/JavaScript
- 토스페이먼츠 SDK

## Task Agent
`frontend-developer`

## Verification Agent
`code-reviewer`

## Tools
- S4BA3 (결제 수단 등록 API) 연동

## Execution Type
AI-Only

## Remarks
- 카드 정보는 토스에서 관리 (PCI DSS 준수)
- 기본 결제 수단으로 정기 결제 진행
- 마스킹된 카드 번호만 표시

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
