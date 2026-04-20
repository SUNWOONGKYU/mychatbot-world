/**
 * @task S8DC1
 * @description Swagger UI — OpenAPI 3.0 스펙 뷰어 (raw HTML route)
 *
 * Route: GET /api-docs
 * Spec:  docs/openapi.yaml (build time read)
 *
 * Route Handler 로 HTML 을 직접 서빙해야 Swagger UI 인라인 스크립트가 실행됨
 * (React page 의 dangerouslySetInnerHTML 은 <script> 실행하지 않음).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const dynamic = 'force-static';

function loadSpec(): string {
  try {
    return readFileSync(join(process.cwd(), 'docs', 'openapi.yaml'), 'utf-8');
  } catch {
    return 'openapi: 3.0.3\ninfo:\n  title: spec not found\n  version: 0.0.0\npaths: {}\n';
  }
}

export async function GET(): Promise<Response> {
  const spec = loadSpec();
  const specJson = JSON.stringify(spec);
  const html = `<!doctype html>
<html lang="ko">
<head>
<title>API — CoCoBot World</title>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex, nofollow"/>
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css"/>
<style>body{margin:0;background:#fafafa}</style>
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
<script src="https://unpkg.com/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
<script>
(function(){
  var specText = ${specJson};
  var spec = jsyaml.load(specText);
  window.ui = SwaggerUIBundle({
    spec: spec,
    dom_id: '#swagger-ui',
    deepLinking: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 0,
    tryItOutEnabled: false
  });
})();
</script>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
