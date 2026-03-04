#!/usr/bin/env node
// @task S4DO2
// 도메인 연결 상태 확인 스크립트
// Usage: node domain-healthcheck.js <domain>
// Example: node domain-healthcheck.js mychatbot.world

'use strict';

const dns = require('dns');
const https = require('https');
const { promisify } = require('util');

const dnsResolve4 = promisify(dns.resolve4);
const dnsResolveCname = promisify(dns.resolveCname);

// ─── 설정 ────────────────────────────────────────────────────────────────────

const VERCEL_IP = '76.76.21.21';
const VERCEL_CNAME = 'cname.vercel-dns.com';
const TIMEOUT_MS = 10000;

// ─── 유틸리티 ─────────────────────────────────────────────────────────────────

function colorize(text, colorCode) {
  return `\x1b[${colorCode}m${text}\x1b[0m`;
}

const green  = (t) => colorize(t, '32');
const red    = (t) => colorize(t, '31');
const yellow = (t) => colorize(t, '33');
const cyan   = (t) => colorize(t, '36');
const bold   = (t) => colorize(t, '1');

function printHeader(title) {
  const line = '─'.repeat(50);
  console.log(`\n${cyan(line)}`);
  console.log(`  ${bold(title)}`);
  console.log(`${cyan(line)}`);
}

function printResult(label, value, status) {
  const icon = status === 'ok'   ? green('✔')
             : status === 'warn' ? yellow('⚠')
             : red('✘');
  console.log(`  ${icon}  ${label.padEnd(28)} ${value}`);
}

// ─── DNS 확인 ─────────────────────────────────────────────────────────────────

async function checkDns(domain) {
  printHeader('1. DNS 확인');

  // A 레코드
  try {
    const addresses = await dnsResolve4(domain);
    const isVercel = addresses.includes(VERCEL_IP);
    printResult(
      'A 레코드',
      addresses.join(', '),
      isVercel ? 'ok' : 'warn'
    );
    if (!isVercel) {
      console.log(`     ${yellow('→ Vercel IP(' + VERCEL_IP + ')가 포함되지 않았습니다.')}`);
    }
  } catch (err) {
    printResult('A 레코드', `조회 실패 (${err.code})`, 'error');
  }

  // CNAME (www 서브도메인)
  const wwwDomain = domain.startsWith('www.') ? domain : `www.${domain}`;
  try {
    const cnames = await dnsResolveCname(wwwDomain);
    const isVercel = cnames.some((c) => c.includes('vercel-dns.com'));
    printResult(
      `CNAME (${wwwDomain})`,
      cnames.join(', '),
      isVercel ? 'ok' : 'warn'
    );
    if (!isVercel) {
      console.log(`     ${yellow('→ Vercel CNAME(' + VERCEL_CNAME + ')이 포함되지 않았습니다.')}`);
    }
  } catch (err) {
    printResult(`CNAME (${wwwDomain})`, `조회 실패 (${err.code})`, 'warn');
    console.log(`     ${yellow('→ www 서브도메인이 설정되지 않았거나 CNAME이 없습니다.')}`);
  }
}

// ─── HTTPS 접속 + SSL + 응답 시간 확인 ───────────────────────────────────────

async function checkHttps(domain) {
  printHeader('2. HTTPS 접속 및 SSL 인증서 확인');

  return new Promise((resolve) => {
    const url = `https://${domain}/`;
    const startTime = Date.now();

    const req = https.get(
      url,
      {
        timeout: TIMEOUT_MS,
        headers: { 'User-Agent': 'domain-healthcheck/1.0 (S4DO2)' },
      },
      (res) => {
        const elapsed = Date.now() - startTime;
        const cert = res.socket.getPeerCertificate();

        // HTTP 상태코드
        const statusOk = res.statusCode >= 200 && res.statusCode < 400;
        printResult(
          'HTTP 상태코드',
          `${res.statusCode} ${res.statusMessage}`,
          statusOk ? 'ok' : 'error'
        );

        // 응답 시간
        const speedStatus = elapsed < 1000 ? 'ok' : elapsed < 3000 ? 'warn' : 'error';
        printResult('응답 시간', `${elapsed}ms`, speedStatus);

        // SSL 인증서 발급자
        if (cert && cert.issuer) {
          const issuer = cert.issuer.O || cert.issuer.CN || '알 수 없음';
          printResult('SSL 발급자', issuer, 'ok');
        } else {
          printResult('SSL 발급자', '인증서 정보 없음', 'warn');
        }

        // SSL 유효기간
        if (cert && cert.valid_to) {
          const expiryDate = new Date(cert.valid_to);
          const now = new Date();
          const daysLeft = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));

          const expiryStatus = daysLeft > 30 ? 'ok' : daysLeft > 7 ? 'warn' : 'error';
          printResult(
            'SSL 만료일',
            `${expiryDate.toISOString().split('T')[0]} (${daysLeft}일 남음)`,
            expiryStatus
          );

          if (daysLeft <= 30) {
            console.log(`     ${yellow('→ 인증서 갱신을 확인하세요. (Vercel은 자동 갱신)')}`);
          }
        } else {
          printResult('SSL 만료일', '정보 없음', 'warn');
        }

        // HSTS 헤더
        const hsts = res.headers['strict-transport-security'];
        if (hsts) {
          printResult('HSTS 헤더', hsts, 'ok');
        } else {
          printResult('HSTS 헤더', '없음 (domain-setup-guide.md 참조)', 'warn');
        }

        res.resume();
        resolve({ statusCode: res.statusCode, elapsed });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      printResult('HTTPS 접속', `타임아웃 (${TIMEOUT_MS}ms 초과)`, 'error');
      resolve({ statusCode: null, elapsed: TIMEOUT_MS });
    });

    req.on('error', (err) => {
      const elapsed = Date.now() - startTime;
      if (err.code === 'ECONNREFUSED') {
        printResult('HTTPS 접속', '연결 거부 — 서버가 응답하지 않음', 'error');
      } else if (err.code === 'CERT_HAS_EXPIRED') {
        printResult('SSL 인증서', '만료됨', 'error');
      } else if (err.code === 'ENOTFOUND') {
        printResult('HTTPS 접속', `도메인을 찾을 수 없음 (${err.code})`, 'error');
        console.log(`     ${yellow('→ DNS가 아직 전파되지 않았을 수 있습니다.')}`);
      } else {
        printResult('HTTPS 접속', `오류: ${err.message}`, 'error');
      }
      resolve({ statusCode: null, elapsed });
    });
  });
}

// ─── 요약 출력 ────────────────────────────────────────────────────────────────

function printSummary(domain, dnsOk, httpsResult) {
  printHeader('3. 종합 결과');

  const allOk = dnsOk && httpsResult.statusCode >= 200 && httpsResult.statusCode < 400;

  if (allOk) {
    console.log(`  ${green('✔  도메인 연결이 정상입니다.')}`);
    console.log(`     ${cyan('https://' + domain)} 접속 확인 완료`);
  } else {
    console.log(`  ${red('✘  도메인 연결에 문제가 있습니다.')}`);
    console.log(`     위의 항목을 확인하고 domain-setup-guide.md를 참조하세요.`);
  }

  console.log('');
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

async function main() {
  const domain = process.argv[2];

  if (!domain) {
    console.error(`${red('오류:')} 도메인을 인수로 전달하세요.`);
    console.error(`사용법: node domain-healthcheck.js <domain>`);
    console.error(`예시:   node domain-healthcheck.js mychatbot.world`);
    process.exit(1);
  }

  console.log(`\n${bold('domain-healthcheck')}  —  @task S4DO2`);
  console.log(`대상 도메인: ${cyan(domain)}`);
  console.log(`실행 시각:   ${new Date().toISOString()}`);

  let dnsOk = false;

  try {
    await checkDns(domain);
    dnsOk = true;
  } catch (err) {
    console.error(`DNS 확인 중 예외 발생: ${err.message}`);
  }

  const httpsResult = await checkHttps(domain);
  printSummary(domain, dnsOk, httpsResult);
}

main().catch((err) => {
  console.error(`예상치 못한 오류: ${err.message}`);
  process.exit(1);
});
