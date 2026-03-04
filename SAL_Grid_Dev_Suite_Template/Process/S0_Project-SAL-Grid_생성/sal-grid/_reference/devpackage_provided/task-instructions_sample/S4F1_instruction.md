# Task Instruction - S4F1

---

## 필수 참조 규칙 파일 (2025-12-19)

> **작업 전 반드시 아래 규칙 파일을 확인하세요!**

| 규칙 파일 | 내용 | 참조 시점 |
|----------|------|----------|
| `.claude/rules/01_file-naming.md` | 파일 명명 규칙 | 파일 생성 시 |
| `.claude/rules/02_save-location.md` | 저장 위치 규칙 | 파일 저장 시 |
| `.claude/rules/03_area-stage.md` | Area/Stage 매핑 | 폴더 선택 시 |
| `.claude/rules/05_execution-process.md` | 6단계 실행 프로세스 | 작업 전체 |

## 필수 참조 리포트

| 리포트 | 용도 |
|--------|------|
| `Human_ClaudeCode_Bridge/Reports/SSALWorks_요금체계_정리.json` | 결제 금액 및 정책 참조 |

---

## Task ID
S4F1

## Task Name
관리자 대시보드 강화

## Task Goal
통계 대시보드, 사용자 관리, **설치비 입금 확인**, **크레딧/구독 결제 관리** 기능을 갖춘 관리자 인터페이스 구현

## Prerequisites (Dependencies)
- S4BA1 (설치비 무통장 입금 API) 완료
- S4BA2 (설치비 입금 확인 API) 완료
- S4BA3 (토스페이먼츠 결제 API) 완료

---

## 결제 시스템 개요

### 결제 유형별 관리

| 결제 유형 | 결제 방법 | 관리 페이지 | 금액 |
|----------|----------|------------|------|
| 설치비 | 무통장 입금 | `installation.html` | ₩3,000,000 |
| 크레딧 충전 | 토스페이먼츠 | `payments.html` | ₩10,000~₩50,000 |
| 월 이용료 | 토스 빌링 | `subscriptions.html` | ₩50,000/월 |

### 사용할 API (S4BA1, S4BA2, S4BA3 참조)

```javascript
// 설치비 관련 (S4BA1, S4BA2)
GET  /api/admin/installation/pending   // 입금 대기 목록
POST /api/admin/installation/confirm   // 입금 확인 (크레딧 ₩50,000 자동 지급)
POST /api/admin/installation/reject    // 입금 거부
GET  /api/admin/installation/history   // 처리 이력

// 결제 관련 (S4BA3)
GET  /api/admin/payments               // 결제 내역 (크레딧/구독)
GET  /api/admin/billing/users          // 빌링 등록 사용자 목록
POST /api/admin/billing/retry          // 결제 재시도

// 통계
GET  /api/admin/stats                  // 통합 통계
GET  /api/admin/chart-data             // 차트 데이터
```

---

## Specific Instructions

### 1. 관리자 대시보드 메인 페이지
- 위치: `P3_프로토타입_제작/Frontend/Prototype/pages/admin/dashboard.html`

```html
<!-- pages/admin/dashboard.html -->
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>관리자 대시보드 - SSALWorks</title>
    <link rel="stylesheet" href="../../shared.css">
    <link rel="stylesheet" href="../../admin.css">
</head>
<body>
    <div class="admin-layout">
        <!-- 사이드바 -->
        <aside class="admin-sidebar">
            <div class="sidebar-header">
                <a href="/" class="logo">SSALWorks</a>
                <span class="badge admin">Admin</span>
            </div>
            <nav class="sidebar-nav">
                <a href="dashboard.html" class="nav-item active">📊 대시보드</a>
                <a href="users.html" class="nav-item">👥 사용자 관리</a>
                <a href="installation.html" class="nav-item">
                    🏦 설치비 관리
                    <span class="badge pending" id="nav-pending-installation">0</span>
                </a>
                <a href="subscriptions.html" class="nav-item">💳 구독 관리</a>
                <a href="payments.html" class="nav-item">💰 결제 내역</a>
                <a href="credits.html" class="nav-item">🎫 크레딧 관리</a>
                <a href="content.html" class="nav-item">📚 콘텐츠 관리</a>
                <a href="settings.html" class="nav-item">⚙️ 설정</a>
            </nav>
        </aside>

        <!-- 메인 콘텐츠 -->
        <main class="admin-main">
            <header class="admin-header">
                <h1>대시보드</h1>
                <div class="header-actions">
                    <span class="admin-user" id="admin-name">관리자</span>
                    <button onclick="logout()">로그아웃</button>
                </div>
            </header>

            <!-- 긴급 알림 (입금 대기 있을 때) -->
            <section class="urgent-alert" id="urgent-alert" style="display:none;">
                <div class="alert alert-warning">
                    <span class="alert-icon">⚠️</span>
                    <span class="alert-text">
                        <strong>입금 확인 대기:</strong>
                        <span id="urgent-count">0</span>건의 설치비 입금이 확인 대기 중입니다.
                    </span>
                    <a href="installation.html?status=pending" class="alert-action">지금 확인</a>
                </div>
            </section>

            <!-- 통계 카드 -->
            <section class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-info">
                        <span class="stat-value" id="total-users">0</span>
                        <span class="stat-label">총 사용자</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💳</div>
                    <div class="stat-info">
                        <span class="stat-value" id="active-subscriptions">0</span>
                        <span class="stat-label">활성 구독</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-info">
                        <span class="stat-value" id="monthly-revenue">₩0</span>
                        <span class="stat-label">월 매출</span>
                    </div>
                </div>
                <div class="stat-card highlight">
                    <div class="stat-icon">🏦</div>
                    <div class="stat-info">
                        <span class="stat-value" id="pending-installations">0</span>
                        <span class="stat-label">입금 대기</span>
                    </div>
                </div>
            </section>

            <!-- 매출 구분 -->
            <section class="revenue-breakdown">
                <h3>매출 구분</h3>
                <div class="revenue-cards">
                    <div class="revenue-card">
                        <span class="revenue-label">설치비 (무통장)</span>
                        <span class="revenue-value" id="revenue-installation">₩0</span>
                        <span class="revenue-count" id="count-installation">0건</span>
                    </div>
                    <div class="revenue-card">
                        <span class="revenue-label">크레딧 충전 (토스)</span>
                        <span class="revenue-value" id="revenue-credit">₩0</span>
                        <span class="revenue-count" id="count-credit">0건</span>
                    </div>
                    <div class="revenue-card">
                        <span class="revenue-label">월 이용료 (토스)</span>
                        <span class="revenue-value" id="revenue-subscription">₩0</span>
                        <span class="revenue-count" id="count-subscription">0건</span>
                    </div>
                </div>
            </section>

            <!-- 차트 영역 -->
            <section class="charts-grid">
                <div class="chart-card">
                    <h3>가입자 추이</h3>
                    <canvas id="users-chart"></canvas>
                </div>
                <div class="chart-card">
                    <h3>매출 추이</h3>
                    <canvas id="revenue-chart"></canvas>
                </div>
            </section>

            <!-- 대기 중인 작업 -->
            <section class="pending-tasks">
                <h3>대기 중인 작업</h3>
                <div class="task-cards">
                    <div class="task-card urgent">
                        <span class="task-count" id="task-installations">0</span>
                        <span class="task-label">설치비 입금 확인</span>
                        <a href="installation.html?status=pending">처리하기 →</a>
                    </div>
                    <div class="task-card">
                        <span class="task-count" id="task-billing-failed">0</span>
                        <span class="task-label">결제 실패 재시도</span>
                        <a href="subscriptions.html?status=failed">확인하기 →</a>
                    </div>
                    <div class="task-card">
                        <span class="task-count" id="task-low-credit">0</span>
                        <span class="task-label">크레딧 부족 사용자</span>
                        <a href="credits.html?filter=low">확인하기 →</a>
                    </div>
                </div>
            </section>

            <!-- 최근 활동 -->
            <section class="recent-activity">
                <h3>최근 결제 활동</h3>
                <div class="activity-list" id="activity-list">
                    <!-- 동적 로드 -->
                </div>
            </section>
        </main>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script type="module" src="../../admin-dashboard.js"></script>
</body>
</html>
```

---

### 2. 설치비 관리 페이지 (입금 확인)
- 위치: `P3_프로토타입_제작/Frontend/Prototype/pages/admin/installation.html`
- **핵심 기능**: 설치비 ₩3,000,000 입금 확인 및 처리

```html
<!-- pages/admin/installation.html -->
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>설치비 관리 - SSALWorks Admin</title>
    <link rel="stylesheet" href="../../shared.css">
    <link rel="stylesheet" href="../../admin.css">
</head>
<body>
    <div class="admin-layout">
        <!-- 사이드바 (동일) -->
        <aside class="admin-sidebar">
            <!-- ... -->
        </aside>

        <main class="admin-main">
            <header class="admin-header">
                <h1>🏦 설치비 관리</h1>
                <div class="header-filters">
                    <select id="status-filter" onchange="filterByStatus()">
                        <option value="all">전체</option>
                        <option value="pending">입금 대기</option>
                        <option value="confirmed">입금 확인</option>
                        <option value="rejected">거부됨</option>
                        <option value="expired">만료됨</option>
                    </select>
                </div>
            </header>

            <!-- 입금 정보 안내 -->
            <section class="bank-info-card">
                <h3>입금 계좌 정보</h3>
                <div class="bank-details">
                    <p><strong>은행:</strong> <span id="bank-name">-</span></p>
                    <p><strong>계좌번호:</strong> <span id="bank-account">-</span></p>
                    <p><strong>예금주:</strong> <span id="bank-holder">-</span></p>
                    <p><strong>설치비:</strong> ₩3,000,000</p>
                </div>
            </section>

            <!-- 입금 대기 목록 -->
            <section class="data-table-section">
                <table class="data-table" id="installation-table">
                    <thead>
                        <tr>
                            <th>입금코드</th>
                            <th>사용자</th>
                            <th>요청일</th>
                            <th>만료일</th>
                            <th>금액</th>
                            <th>상태</th>
                            <th>작업</th>
                        </tr>
                    </thead>
                    <tbody id="installation-list">
                        <!-- 동적 로드 -->
                    </tbody>
                </table>
            </section>
        </main>
    </div>

    <!-- 입금 확인 모달 -->
    <div class="modal" id="confirm-modal" style="display:none;">
        <div class="modal-content">
            <h2>입금 확인</h2>
            <div class="confirm-details">
                <p><strong>사용자:</strong> <span id="modal-user"></span></p>
                <p><strong>입금코드:</strong> <span id="modal-code"></span></p>
                <p><strong>금액:</strong> ₩3,000,000</p>
            </div>
            <div class="confirm-benefits">
                <h4>확인 시 자동 처리:</h4>
                <ul>
                    <li>✅ 서비스 활성화</li>
                    <li>✅ 초기 크레딧 ₩50,000 지급</li>
                    <li>✅ 3개월 무료 기간 시작</li>
                    <li>✅ 환영 이메일 발송</li>
                </ul>
            </div>
            <div class="form-group">
                <label>관리자 메모 (선택)</label>
                <textarea id="admin-note" placeholder="내부 메모..."></textarea>
            </div>
            <div class="modal-actions">
                <button class="btn-secondary" onclick="closeModal()">취소</button>
                <button class="btn-primary" onclick="confirmPayment()">입금 확인</button>
            </div>
        </div>
    </div>

    <!-- 거부 모달 -->
    <div class="modal" id="reject-modal" style="display:none;">
        <div class="modal-content">
            <h2>입금 거부</h2>
            <div class="form-group">
                <label>거부 사유 (필수)</label>
                <select id="reject-reason" required>
                    <option value="">선택하세요</option>
                    <option value="amount_mismatch">금액 불일치</option>
                    <option value="name_mismatch">입금자명 불일치</option>
                    <option value="duplicate">중복 요청</option>
                    <option value="other">기타</option>
                </select>
            </div>
            <div class="form-group">
                <label>상세 사유</label>
                <textarea id="reject-detail" placeholder="상세 사유..."></textarea>
            </div>
            <div class="modal-actions">
                <button class="btn-secondary" onclick="closeModal()">취소</button>
                <button class="btn-danger" onclick="rejectPayment()">거부</button>
            </div>
        </div>
    </div>

    <script type="module" src="../../admin-installation.js"></script>
</body>
</html>
```

---

### 3. 결제 내역 페이지 (토스페이먼츠)
- 위치: `P3_프로토타입_제작/Frontend/Prototype/pages/admin/payments.html`
- **핵심 기능**: 크레딧 충전, 월 이용료 결제 내역 조회

```html
<!-- pages/admin/payments.html -->
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>결제 내역 - SSALWorks Admin</title>
    <link rel="stylesheet" href="../../shared.css">
    <link rel="stylesheet" href="../../admin.css">
</head>
<body>
    <div class="admin-layout">
        <aside class="admin-sidebar"><!-- ... --></aside>

        <main class="admin-main">
            <header class="admin-header">
                <h1>💰 결제 내역</h1>
                <div class="header-filters">
                    <select id="type-filter" onchange="filterPayments()">
                        <option value="all">전체</option>
                        <option value="credit">크레딧 충전</option>
                        <option value="subscription">월 이용료</option>
                    </select>
                    <select id="status-filter" onchange="filterPayments()">
                        <option value="all">전체 상태</option>
                        <option value="success">성공</option>
                        <option value="failed">실패</option>
                        <option value="refunded">환불</option>
                    </select>
                    <input type="date" id="date-from" onchange="filterPayments()">
                    <span>~</span>
                    <input type="date" id="date-to" onchange="filterPayments()">
                </div>
            </header>

            <!-- 결제 통계 요약 -->
            <section class="payment-summary">
                <div class="summary-card">
                    <span class="summary-label">이번 달 총 결제</span>
                    <span class="summary-value" id="total-payments">₩0</span>
                </div>
                <div class="summary-card">
                    <span class="summary-label">크레딧 충전</span>
                    <span class="summary-value" id="credit-payments">₩0</span>
                </div>
                <div class="summary-card">
                    <span class="summary-label">월 이용료</span>
                    <span class="summary-value" id="subscription-payments">₩0</span>
                </div>
                <div class="summary-card warning">
                    <span class="summary-label">결제 실패</span>
                    <span class="summary-value" id="failed-payments">0건</span>
                </div>
            </section>

            <!-- 결제 목록 -->
            <section class="data-table-section">
                <table class="data-table" id="payments-table">
                    <thead>
                        <tr>
                            <th>결제ID</th>
                            <th>사용자</th>
                            <th>유형</th>
                            <th>금액</th>
                            <th>결제수단</th>
                            <th>상태</th>
                            <th>결제일시</th>
                            <th>작업</th>
                        </tr>
                    </thead>
                    <tbody id="payments-list">
                        <!-- 동적 로드 -->
                    </tbody>
                </table>
                <div class="pagination" id="pagination"></div>
            </section>
        </main>
    </div>

    <!-- 결제 상세 모달 -->
    <div class="modal" id="payment-detail-modal" style="display:none;">
        <div class="modal-content">
            <h2>결제 상세</h2>
            <div id="payment-details"></div>
            <div class="modal-actions">
                <button class="btn-secondary" onclick="closeModal()">닫기</button>
            </div>
        </div>
    </div>

    <script type="module" src="../../admin-payments.js"></script>
</body>
</html>
```

---

### 4. 구독 관리 페이지 (빌링)
- 위치: `P3_프로토타입_제작/Frontend/Prototype/pages/admin/subscriptions.html`
- **핵심 기능**: 월 이용료 자동결제 관리

```html
<!-- pages/admin/subscriptions.html -->
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>구독 관리 - SSALWorks Admin</title>
    <link rel="stylesheet" href="../../shared.css">
    <link rel="stylesheet" href="../../admin.css">
</head>
<body>
    <div class="admin-layout">
        <aside class="admin-sidebar"><!-- ... --></aside>

        <main class="admin-main">
            <header class="admin-header">
                <h1>💳 구독 관리</h1>
                <div class="header-filters">
                    <select id="status-filter" onchange="filterSubscriptions()">
                        <option value="all">전체</option>
                        <option value="free_trial">무료 기간</option>
                        <option value="active">정상 구독</option>
                        <option value="payment_failed">결제 실패</option>
                        <option value="suspended">정지</option>
                    </select>
                </div>
            </header>

            <!-- 구독 통계 -->
            <section class="subscription-stats">
                <div class="stat-card">
                    <span class="stat-value" id="stat-free-trial">0</span>
                    <span class="stat-label">무료 기간 (1~3개월)</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value" id="stat-active">0</span>
                    <span class="stat-label">정상 구독</span>
                </div>
                <div class="stat-card warning">
                    <span class="stat-value" id="stat-failing">0</span>
                    <span class="stat-label">결제 실패</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value" id="stat-upcoming">0</span>
                    <span class="stat-label">이번 주 청구 예정</span>
                </div>
            </section>

            <!-- 구독자 목록 -->
            <section class="data-table-section">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>사용자</th>
                            <th>가입일</th>
                            <th>구독 시작</th>
                            <th>현재 상태</th>
                            <th>다음 결제일</th>
                            <th>결제 수단</th>
                            <th>작업</th>
                        </tr>
                    </thead>
                    <tbody id="subscriptions-list">
                        <!-- 동적 로드 -->
                    </tbody>
                </table>
            </section>
        </main>
    </div>

    <script type="module" src="../../admin-subscriptions.js"></script>
</body>
</html>
```

---

### 5. 크레딧 관리 페이지
- 위치: `P3_프로토타입_제작/Frontend/Prototype/pages/admin/credits.html`
- **핵심 기능**: 사용자별 크레딧 잔액 및 사용 내역 관리

```html
<!-- pages/admin/credits.html -->
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>크레딧 관리 - SSALWorks Admin</title>
    <link rel="stylesheet" href="../../shared.css">
    <link rel="stylesheet" href="../../admin.css">
</head>
<body>
    <div class="admin-layout">
        <aside class="admin-sidebar"><!-- ... --></aside>

        <main class="admin-main">
            <header class="admin-header">
                <h1>🎫 크레딧 관리</h1>
                <div class="header-filters">
                    <select id="filter" onchange="filterCredits()">
                        <option value="all">전체</option>
                        <option value="low">잔액 부족 (10,000원 미만)</option>
                        <option value="zero">잔액 0원</option>
                    </select>
                    <input type="search" id="search" placeholder="사용자 검색...">
                </div>
            </header>

            <!-- 크레딧 통계 -->
            <section class="credit-stats">
                <div class="stat-card">
                    <span class="stat-value" id="total-credits">₩0</span>
                    <span class="stat-label">총 발행 크레딧</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value" id="used-credits">₩0</span>
                    <span class="stat-label">총 사용 크레딧</span>
                </div>
                <div class="stat-card warning">
                    <span class="stat-value" id="low-credit-users">0</span>
                    <span class="stat-label">잔액 부족 사용자</span>
                </div>
            </section>

            <!-- 사용자별 크레딧 -->
            <section class="data-table-section">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>사용자</th>
                            <th>현재 잔액</th>
                            <th>총 충전</th>
                            <th>총 사용</th>
                            <th>마지막 충전</th>
                            <th>작업</th>
                        </tr>
                    </thead>
                    <tbody id="credits-list"></tbody>
                </table>
            </section>
        </main>
    </div>

    <!-- 크레딧 내역 모달 -->
    <div class="modal" id="credit-history-modal" style="display:none;">
        <div class="modal-content wide">
            <h2>크레딧 사용 내역</h2>
            <div id="credit-history-list"></div>
            <div class="modal-actions">
                <button onclick="closeModal()">닫기</button>
            </div>
        </div>
    </div>

    <!-- 크레딧 지급 모달 (관리자용) -->
    <div class="modal" id="grant-credit-modal" style="display:none;">
        <div class="modal-content">
            <h2>크레딧 수동 지급</h2>
            <p class="warning-text">⚠️ 관리자 수동 지급은 로그에 기록됩니다.</p>
            <div class="form-group">
                <label>지급 금액</label>
                <input type="number" id="grant-amount" min="1000" step="1000">
            </div>
            <div class="form-group">
                <label>지급 사유</label>
                <select id="grant-reason" required>
                    <option value="">선택</option>
                    <option value="compensation">보상 지급</option>
                    <option value="promotion">프로모션</option>
                    <option value="error_correction">오류 정정</option>
                    <option value="other">기타</option>
                </select>
            </div>
            <div class="form-group">
                <label>상세 메모</label>
                <textarea id="grant-memo"></textarea>
            </div>
            <div class="modal-actions">
                <button class="btn-secondary" onclick="closeModal()">취소</button>
                <button class="btn-primary" onclick="grantCredit()">지급</button>
            </div>
        </div>
    </div>

    <script type="module" src="../../admin-credits.js"></script>
</body>
</html>
```

---

### 6. 관리자 대시보드 JavaScript
- 위치: `P3_프로토타입_제작/Frontend/Prototype/admin-dashboard.js`

```javascript
// admin-dashboard.js
/**
 * @task S4F1
 * 관리자 대시보드 메인 로직
 */

document.addEventListener('DOMContentLoaded', async () => {
    await checkAdminAuth();
    await loadDashboardStats();
    await loadRevenueBreakdown();
    await loadCharts();
    await loadPendingTasks();
    await loadRecentActivity();
});

async function checkAdminAuth() {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
        window.location.href = '/pages/auth/login.html?redirect=admin';
        return;
    }
    document.getElementById('admin-name').textContent = user.name || user.email;
}

async function loadDashboardStats() {
    try {
        const response = await fetch('/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const stats = await response.json();

        document.getElementById('total-users').textContent = stats.totalUsers.toLocaleString();
        document.getElementById('active-subscriptions').textContent = stats.activeSubscriptions.toLocaleString();
        document.getElementById('monthly-revenue').textContent = `₩${stats.monthlyRevenue.toLocaleString()}`;
        document.getElementById('pending-installations').textContent = stats.pendingInstallations;

        // 긴급 알림 표시
        if (stats.pendingInstallations > 0) {
            document.getElementById('urgent-alert').style.display = 'block';
            document.getElementById('urgent-count').textContent = stats.pendingInstallations;
        }

        // 네비게이션 배지
        document.getElementById('nav-pending-installation').textContent = stats.pendingInstallations;
    } catch (error) {
        console.error('Stats load error:', error);
    }
}

async function loadRevenueBreakdown() {
    try {
        const response = await fetch('/api/admin/revenue-breakdown', {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const data = await response.json();

        // 설치비 (무통장)
        document.getElementById('revenue-installation').textContent =
            `₩${data.installation.amount.toLocaleString()}`;
        document.getElementById('count-installation').textContent =
            `${data.installation.count}건`;

        // 크레딧 충전 (토스)
        document.getElementById('revenue-credit').textContent =
            `₩${data.credit.amount.toLocaleString()}`;
        document.getElementById('count-credit').textContent =
            `${data.credit.count}건`;

        // 월 이용료 (토스)
        document.getElementById('revenue-subscription').textContent =
            `₩${data.subscription.amount.toLocaleString()}`;
        document.getElementById('count-subscription').textContent =
            `${data.subscription.count}건`;
    } catch (error) {
        console.error('Revenue breakdown error:', error);
    }
}

async function loadPendingTasks() {
    try {
        const response = await fetch('/api/admin/pending-counts', {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const counts = await response.json();

        document.getElementById('task-installations').textContent = counts.installations;
        document.getElementById('task-billing-failed').textContent = counts.billingFailed;
        document.getElementById('task-low-credit').textContent = counts.lowCredit;
    } catch (error) {
        console.error('Pending tasks load error:', error);
    }
}

async function loadCharts() {
    try {
        const response = await fetch('/api/admin/chart-data', {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const data = await response.json();

        // 가입자 추이 차트
        new Chart(document.getElementById('users-chart'), {
            type: 'line',
            data: {
                labels: data.users.labels,
                datasets: [{
                    label: '신규 가입자',
                    data: data.users.values,
                    borderColor: '#3182ce',
                    tension: 0.1
                }]
            }
        });

        // 매출 추이 차트 (설치비/크레딧/구독 구분)
        new Chart(document.getElementById('revenue-chart'), {
            type: 'bar',
            data: {
                labels: data.revenue.labels,
                datasets: [
                    {
                        label: '설치비',
                        data: data.revenue.installation,
                        backgroundColor: '#9f7aea'
                    },
                    {
                        label: '크레딧 충전',
                        data: data.revenue.credit,
                        backgroundColor: '#48bb78'
                    },
                    {
                        label: '월 이용료',
                        data: data.revenue.subscription,
                        backgroundColor: '#4299e1'
                    }
                ]
            },
            options: {
                scales: {
                    x: { stacked: true },
                    y: { stacked: true }
                }
            }
        });
    } catch (error) {
        console.error('Charts load error:', error);
    }
}

async function loadRecentActivity() {
    try {
        const response = await fetch('/api/admin/activity?limit=10', {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const activities = await response.json();

        const container = document.getElementById('activity-list');
        container.innerHTML = activities.map(a => `
            <div class="activity-item ${a.type}">
                <span class="activity-icon">${getActivityIcon(a.type)}</span>
                <div class="activity-content">
                    <span class="activity-text">${a.message}</span>
                    <span class="activity-time">${formatTime(a.created_at)}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Activity load error:', error);
    }
}

function getActivityIcon(type) {
    const icons = {
        signup: '👤',
        installation_request: '🏦',
        installation_confirmed: '✅',
        credit_charge: '🎫',
        subscription_payment: '💳',
        ai_query: '🤖',
        payment_failed: '❌'
    };
    return icons[type] || '📝';
}

function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff/60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}시간 전`;
    return date.toLocaleDateString('ko-KR');
}

function getAccessToken() {
    return localStorage.getItem('accessToken') || '';
}

async function getCurrentUser() {
    try {
        const response = await fetch('/api/user/me', {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        return response.ok ? await response.json() : null;
    } catch {
        return null;
    }
}

function logout() {
    localStorage.removeItem('accessToken');
    window.location.href = '/pages/auth/login.html';
}
```

---

### 7. 설치비 관리 JavaScript
- 위치: `P3_프로토타입_제작/Frontend/Prototype/admin-installation.js`

```javascript
// admin-installation.js
/**
 * @task S4F1
 * 설치비 입금 확인 관리
 */

let currentDeposit = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadBankInfo();
    await loadInstallationList();
});

async function loadBankInfo() {
    try {
        const response = await fetch('/api/payment/installation/info');
        const info = await response.json();

        document.getElementById('bank-name').textContent = info.bank_name;
        document.getElementById('bank-account').textContent = info.account_number;
        document.getElementById('bank-holder').textContent = info.account_holder;
    } catch (error) {
        console.error('Bank info load error:', error);
    }
}

async function loadInstallationList() {
    try {
        const status = document.getElementById('status-filter').value;
        const url = status === 'all'
            ? '/api/admin/installation/pending'
            : `/api/admin/installation/pending?status=${status}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${getAccessToken()}` }
        });
        const deposits = await response.json();

        renderInstallationTable(deposits);
    } catch (error) {
        console.error('Installation list load error:', error);
    }
}

function renderInstallationTable(deposits) {
    const tbody = document.getElementById('installation-list');
    tbody.innerHTML = deposits.map(d => `
        <tr class="status-${d.status}">
            <td><code>${d.deposit_code}</code></td>
            <td>
                <div class="user-info">
                    <span class="user-name">${d.user_name || d.user_email}</span>
                    <span class="user-email">${d.user_email}</span>
                </div>
            </td>
            <td>${formatDate(d.created_at)}</td>
            <td>${formatDate(d.expires_at)}</td>
            <td>₩${d.amount.toLocaleString()}</td>
            <td><span class="status-badge ${d.status}">${getStatusLabel(d.status)}</span></td>
            <td>
                ${d.status === 'pending' ? `
                    <button class="btn-sm btn-primary" onclick="openConfirmModal('${d.id}')">
                        입금 확인
                    </button>
                    <button class="btn-sm btn-danger" onclick="openRejectModal('${d.id}')">
                        거부
                    </button>
                ` : '-'}
            </td>
        </tr>
    `).join('');
}

function openConfirmModal(depositId) {
    // 해당 deposit 정보 찾기
    fetch(`/api/admin/installation/${depositId}`, {
        headers: { 'Authorization': `Bearer ${getAccessToken()}` }
    })
    .then(r => r.json())
    .then(deposit => {
        currentDeposit = deposit;
        document.getElementById('modal-user').textContent = deposit.user_email;
        document.getElementById('modal-code').textContent = deposit.deposit_code;
        document.getElementById('confirm-modal').style.display = 'flex';
    });
}

async function confirmPayment() {
    if (!currentDeposit) return;

    try {
        const response = await fetch('/api/admin/installation/confirm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
            },
            body: JSON.stringify({
                deposit_id: currentDeposit.id,
                admin_note: document.getElementById('admin-note').value
            })
        });

        const result = await response.json();

        if (result.success) {
            alert(`입금 확인 완료!\n- 서비스 활성화\n- 초기 크레딧 ₩50,000 지급\n- 환영 이메일 발송됨`);
            closeModal();
            loadInstallationList();
        } else {
            alert('오류: ' + result.error);
        }
    } catch (error) {
        alert('처리 중 오류가 발생했습니다.');
    }
}

function openRejectModal(depositId) {
    fetch(`/api/admin/installation/${depositId}`, {
        headers: { 'Authorization': `Bearer ${getAccessToken()}` }
    })
    .then(r => r.json())
    .then(deposit => {
        currentDeposit = deposit;
        document.getElementById('reject-modal').style.display = 'flex';
    });
}

async function rejectPayment() {
    if (!currentDeposit) return;

    const reason = document.getElementById('reject-reason').value;
    if (!reason) {
        alert('거부 사유를 선택해주세요.');
        return;
    }

    try {
        const response = await fetch('/api/admin/installation/reject', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
            },
            body: JSON.stringify({
                deposit_id: currentDeposit.id,
                reason: reason,
                detail: document.getElementById('reject-detail').value
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('거부 처리되었습니다.');
            closeModal();
            loadInstallationList();
        } else {
            alert('오류: ' + result.error);
        }
    } catch (error) {
        alert('처리 중 오류가 발생했습니다.');
    }
}

function closeModal() {
    document.getElementById('confirm-modal').style.display = 'none';
    document.getElementById('reject-modal').style.display = 'none';
    currentDeposit = null;
}

function getStatusLabel(status) {
    const labels = {
        pending: '입금 대기',
        confirmed: '입금 확인',
        rejected: '거부됨',
        expired: '만료됨'
    };
    return labels[status] || status;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getAccessToken() {
    return localStorage.getItem('accessToken') || '';
}

function filterByStatus() {
    loadInstallationList();
}
```

---

### 8. 관리자 CSS (업데이트)
- 위치: `P3_프로토타입_제작/Frontend/Prototype/admin.css`

```css
/* admin.css */
/**
 * @task S4F1
 * 관리자 대시보드 스타일
 */

.admin-layout {
    display: flex;
    min-height: 100vh;
}

/* 사이드바 */
.admin-sidebar {
    width: 250px;
    background: #1a202c;
    color: white;
    padding: 1.5rem;
}

.sidebar-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 2rem;
}

.badge.admin {
    background: #e53e3e;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
}

.badge.pending {
    background: #ed8936;
    color: white;
    padding: 0.15rem 0.4rem;
    border-radius: 10px;
    font-size: 0.65rem;
    margin-left: auto;
}

.sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.nav-item {
    color: #a0aec0;
    text-decoration: none;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
}

.nav-item:hover, .nav-item.active {
    background: #2d3748;
    color: white;
}

/* 메인 */
.admin-main {
    flex: 1;
    padding: 2rem;
    background: #f7fafc;
}

.admin-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

/* 긴급 알림 */
.urgent-alert {
    margin-bottom: 1.5rem;
}

.alert {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-radius: 8px;
}

.alert-warning {
    background: #fef3c7;
    border: 1px solid #f59e0b;
}

.alert-action {
    margin-left: auto;
    color: #d97706;
    font-weight: 600;
}

/* 통계 카드 */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.stat-card.highlight {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
}

.stat-card.highlight .stat-label {
    color: rgba(255,255,255,0.8);
}

.stat-icon {
    font-size: 2rem;
}

.stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    display: block;
}

.stat-label {
    color: #718096;
    font-size: 0.9rem;
}

/* 매출 구분 */
.revenue-breakdown {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.revenue-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-top: 1rem;
}

.revenue-card {
    background: #f7fafc;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
}

.revenue-label {
    display: block;
    color: #718096;
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
}

.revenue-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: #2d3748;
}

.revenue-count {
    display: block;
    font-size: 0.8rem;
    color: #a0aec0;
}

/* 차트 */
.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.chart-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
}

/* 대기 작업 */
.pending-tasks {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

.task-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
}

.task-card {
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
}

.task-card.urgent {
    background: #fff5f5;
    border-color: #feb2b2;
}

.task-count {
    font-size: 2rem;
    font-weight: 700;
    display: block;
}

.task-card.urgent .task-count {
    color: #e53e3e;
}

/* 테이블 */
.data-table-section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    overflow-x: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th,
.data-table td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
}

.data-table th {
    background: #f7fafc;
    font-weight: 600;
    color: #4a5568;
}

.status-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
}

.status-badge.pending {
    background: #fef3c7;
    color: #d97706;
}

.status-badge.confirmed {
    background: #c6f6d5;
    color: #22543d;
}

.status-badge.rejected {
    background: #fed7d7;
    color: #c53030;
}

.status-badge.expired {
    background: #e2e8f0;
    color: #718096;
}

/* 버튼 */
.btn-sm {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    margin: 0 0.25rem;
}

.btn-primary {
    background: #4299e1;
    color: white;
}

.btn-danger {
    background: #e53e3e;
    color: white;
}

.btn-secondary {
    background: #e2e8f0;
    color: #4a5568;
}

/* 모달 */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
}

.modal-content.wide {
    max-width: 800px;
}

.modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}

/* 입금 확인 모달 혜택 목록 */
.confirm-benefits {
    background: #f0fff4;
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
}

.confirm-benefits ul {
    list-style: none;
    padding: 0;
    margin: 0.5rem 0 0 0;
}

.confirm-benefits li {
    padding: 0.25rem 0;
}

/* 최근 활동 */
.recent-activity {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
}

.activity-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid #e2e8f0;
}

.activity-time {
    color: #a0aec0;
    font-size: 0.85rem;
    margin-left: auto;
}

/* 은행 정보 카드 */
.bank-info-card {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

.bank-details p {
    margin: 0.5rem 0;
}
```

---

## Expected Output Files
- `P3_프로토타입_제작/Frontend/Prototype/pages/admin/dashboard.html`
- `P3_프로토타입_제작/Frontend/Prototype/pages/admin/installation.html`
- `P3_프로토타입_제작/Frontend/Prototype/pages/admin/payments.html`
- `P3_프로토타입_제작/Frontend/Prototype/pages/admin/subscriptions.html`
- `P3_프로토타입_제작/Frontend/Prototype/pages/admin/credits.html`
- `P3_프로토타입_제작/Frontend/Prototype/admin-dashboard.js`
- `P3_프로토타입_제작/Frontend/Prototype/admin-installation.js`
- `P3_프로토타입_제작/Frontend/Prototype/admin-payments.js`
- `P3_프로토타입_제작/Frontend/Prototype/admin-subscriptions.js`
- `P3_프로토타입_제작/Frontend/Prototype/admin-credits.js`
- `P3_프로토타입_제작/Frontend/Prototype/admin.css`

---

## Completion Criteria
- [ ] 통계 대시보드 (사용자, 구독, 매출, 입금대기)
- [ ] 매출 구분 (설치비/크레딧/구독)
- [ ] 설치비 입금 확인 페이지 (입금코드, 확인/거부)
- [ ] 결제 내역 페이지 (크레딧/구독)
- [ ] 구독 관리 페이지 (빌링 상태)
- [ ] 크레딧 관리 페이지 (잔액, 사용내역)
- [ ] 관리자 인증 체크
- [ ] 긴급 알림 (입금 대기 시)

---

## Tech Stack
- HTML/CSS/JavaScript
- Chart.js

## Task Agent
`frontend-developer`

## Verification Agent
`code-reviewer`

## Tools
- Chart.js CDN

## Execution Type
AI-Only

## Remarks
- **설치비는 무통장 입금** → 관리자가 직접 확인
- 입금 확인 시 **초기 크레딧 ₩50,000 자동 지급**
- 크레딧/구독은 **토스페이먼츠** 자동 처리
- 관리자 권한 필수 (role='admin')

---

## 작업 결과물 저장 2대 규칙

> **이 규칙은 반드시 준수하세요!**

### 제1 규칙: Stage + Area 폴더에 저장
- Task ID의 Stage와 Area에 해당하는 폴더에 저장
- S4F1 → `S4_개발-3차/Frontend/`

### 제2 규칙: Production 코드는 이중 저장
- Frontend 코드는 Stage 폴더 + Production 폴더 둘 다 저장
- `Production/Frontend/pages/admin/`에도 저장

**Area 폴더 매핑:** F→Frontend
