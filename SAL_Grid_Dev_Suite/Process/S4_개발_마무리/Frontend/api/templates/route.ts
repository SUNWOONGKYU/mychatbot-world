/**
 * @task S4GA1
 * @description Bot Templates API — GET /api/templates
 *
 * templates/*.json 파일을 읽어 템플릿 목록 반환.
 * - category 쿼리 파라미터로 필터링 가능
 * - 공개 엔드포인트 (API 키 불필요)
 * - Edge Runtime: 사용 안 함 (fs 필요 → Node.js runtime)
 */
import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export interface BotTemplate {
  id: string;             // 파일명 (확장자 제외), e.g. "cafe"
  category: string;
  template_name: string;
  persona_prompt: string;
  greeting: string;
  sample_faqs: Array<{ question: string; answer: string }>;
}

/**
 * GET /api/templates
 * Query: category (optional) — 카테고리 필터
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const categoryFilter = searchParams.get('category') ?? null;

    const templatesDir = path.join(process.cwd(), 'templates');

    // templates/ 하위 .json 파일 목록 조회
    let files: string[];
    try {
      const entries = await readdir(templatesDir, { withFileTypes: true });
      files = entries
        .filter((e) => e.isFile() && e.name.endsWith('.json'))
        .map((e) => e.name);
    } catch {
      // templates 디렉토리가 없는 경우
      return NextResponse.json({ templates: [] });
    }

    // 각 파일 파싱
    const templates: BotTemplate[] = [];

    await Promise.all(
      files.map(async (file) => {
        try {
          const raw = await readFile(path.join(templatesDir, file), 'utf-8');
          const data = JSON.parse(raw) as Omit<BotTemplate, 'id'>;
          const id = file.replace(/\.json$/, '');

          // category 필터 적용
          if (categoryFilter && data.category !== categoryFilter) return;

          templates.push({ id, ...data });
        } catch {
          // 파싱 실패한 파일은 무시
        }
      })
    );

    // template_name 기준 가나다 정렬
    templates.sort((a, b) => a.template_name.localeCompare(b.template_name, 'ko'));

    return NextResponse.json({ templates });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[api/templates] Error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
