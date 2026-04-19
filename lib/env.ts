/**
 * @task M9 / 프로덕션 런칭 준비 — 런타임 환경변수 검증
 *
 * 서버 기동 시 필수 환경변수의 존재/형식을 검증한다.
 * 누락 시 의미있는 에러로 조기 실패하여 런타임 "undefined" 버그를 방지.
 *
 * Zod 의존성이 없을 수 있으므로 순수 TS로 구현.
 */

type EnvSchema = {
  key: string;
  required: boolean;
  validate?: (v: string) => boolean;
  description: string;
};

const SERVER_ENV: EnvSchema[] = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    validate: (v) => /^https?:\/\/.+/.test(v),
    description: 'Supabase 프로젝트 URL',
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anon 키',
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    required: false,
    description: 'Supabase service_role 키 (관리자/서버 작업용)',
  },
  {
    key: 'OPENROUTER_API_KEY',
    required: false,
    description: 'OpenRouter API 키 (AI 라우팅)',
  },
  {
    key: 'ADMIN_API_KEY',
    required: false,
    description: '관리자 API 게이트 키',
  },
  {
    key: 'UPSTASH_REDIS_REST_URL',
    required: false,
    description: 'Upstash Redis URL (분산 레이트 리밋)',
  },
  {
    key: 'UPSTASH_REDIS_REST_TOKEN',
    required: false,
    description: 'Upstash Redis 토큰',
  },
];

export interface EnvCheckResult {
  ok: boolean;
  missing: string[];
  invalid: string[];
  warnings: string[];
}

/**
 * 서버 측 환경변수 검증.
 * 클라이언트 번들에 포함되지 않도록 서버 전용 경로에서만 호출할 것.
 */
export function checkServerEnv(): EnvCheckResult {
  const missing: string[] = [];
  const invalid: string[] = [];
  const warnings: string[] = [];

  for (const schema of SERVER_ENV) {
    const value = process.env[schema.key];
    if (!value || value.trim() === '') {
      if (schema.required) {
        missing.push(`${schema.key} — ${schema.description}`);
      } else {
        warnings.push(`${schema.key} 미설정 — ${schema.description}`);
      }
      continue;
    }
    if (schema.validate && !schema.validate(value)) {
      invalid.push(`${schema.key} — 형식 오류 (${schema.description})`);
    }
  }

  return {
    ok: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    warnings,
  };
}

/**
 * 부팅 시 1회 호출. 필수 누락 시 throw하여 조기 실패.
 */
export function assertServerEnv(): void {
  const result = checkServerEnv();
  if (!result.ok) {
    const parts: string[] = [];
    if (result.missing.length) {
      parts.push(`[필수 누락]\n  - ${result.missing.join('\n  - ')}`);
    }
    if (result.invalid.length) {
      parts.push(`[형식 오류]\n  - ${result.invalid.join('\n  - ')}`);
    }
    throw new Error(`환경변수 검증 실패:\n${parts.join('\n')}`);
  }
  if (result.warnings.length && process.env.NODE_ENV !== 'test') {
    console.warn(`[env] 선택 환경변수 경고:\n  - ${result.warnings.join('\n  - ')}`);
  }
}
