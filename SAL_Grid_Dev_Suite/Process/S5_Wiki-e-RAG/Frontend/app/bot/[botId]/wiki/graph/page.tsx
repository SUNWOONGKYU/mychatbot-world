/**
 * @task S5FE5
 * @description Obsidian Graph View — D3.js force-directed 위키 링크 그래프
 *
 * 경로: /bot/[botId]/wiki/graph
 * 기능:
 *  - GET /api/wiki/vault/graph → 노드(wiki_pages) + 링크(slug 참조) 데이터
 *  - D3.js force simulation (cdn or npm)
 *  - 노드 색상: page_type별 구분
 *  - 클릭 시 위키 상세 정보 사이드 패널
 *  - 줌/패닝 지원
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

// ============================
// 타입 정의
// ============================

interface GraphNode {
  id: string;
  slug: string;
  title: string;
  page_type: 'manual' | 'auto_generated' | 'faq';
  quality_score: number;
  view_count: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ============================
// 색상 매핑
// ============================

const NODE_COLORS: Record<string, string> = {
  manual: '#3b82f6',       // 파랑
  auto_generated: '#10b981', // 초록
  faq: '#f59e0b',           // 노랑
};

const NODE_RADIUS = 8;

// ============================
// 컴포넌트
// ============================

export default function WikiGraphPage() {
  const params = useParams<{ botId: string }>();
  const botId = params?.botId ?? '';

  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);

  // 그래프 데이터 로드
  useEffect(() => {
    if (!botId) return;
    const load = async () => {
      setLoading(true);
      try {
        const resp = await fetch(`/api/wiki/vault/graph?bot_id=${botId}`);
        const json = await resp.json();
        if (!json.success) throw new Error(json.error ?? '그래프 데이터 로드 실패');
        setGraphData(json.data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [botId]);

  // D3 렌더링
  useEffect(() => {
    if (!graphData || !svgRef.current) return;

    // 동적으로 D3 로드 (CDN 없이 npm 패키지 사용)
    const renderGraph = async () => {
      try {
        const d3 = await import('d3');
        const svg = d3.select(svgRef.current!);
        svg.selectAll('*').remove();

        const width = svgRef.current!.clientWidth || 800;
        const height = svgRef.current!.clientHeight || 600;

        // 줌/패닝
        const zoomGroup = svg.append('g');
        svg.call(
          d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.3, 3])
            .on('zoom', (event) => {
              zoomGroup.attr('transform', event.transform);
            }) as any
        );

        // Force simulation
        const nodes: GraphNode[] = graphData.nodes.map((n) => ({ ...n }));
        const links: GraphLink[] = graphData.links.map((l) => ({ ...l }));

        const simulation = d3
          .forceSimulation(nodes as any)
          .force(
            'link',
            d3
              .forceLink(links)
              .id((d: any) => d.id)
              .distance(80)
          )
          .force('charge', d3.forceManyBody().strength(-200))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('collision', d3.forceCollide(NODE_RADIUS + 4));

        // 링크 렌더링
        const link = zoomGroup
          .append('g')
          .selectAll('line')
          .data(links)
          .join('line')
          .attr('stroke', '#d1d5db')
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.6);

        // 노드 그룹
        const nodeGroup = zoomGroup
          .append('g')
          .selectAll('g')
          .data(nodes)
          .join('g')
          .attr('cursor', 'pointer')
          .on('click', (_event, d) => {
            setSelected(d as GraphNode);
          })
          .call(
            d3
              .drag<SVGGElement, GraphNode>()
              .on('start', (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
              })
              .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
              })
              .on('end', (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
              }) as any
          );

        // 노드 원
        nodeGroup
          .append('circle')
          .attr('r', (d) => {
            const base = NODE_RADIUS;
            const extra = Math.min(d.view_count / 10, 6);
            return base + extra;
          })
          .attr('fill', (d) => NODE_COLORS[d.page_type] ?? '#6b7280')
          .attr('stroke', '#fff')
          .attr('stroke-width', 2);

        // 노드 레이블
        nodeGroup
          .append('text')
          .text((d) =>
            d.title.length > 20 ? d.title.slice(0, 18) + '…' : d.title
          )
          .attr('x', NODE_RADIUS + 4)
          .attr('y', 4)
          .attr('font-size', '11px')
          .attr('fill', '#374151')
          .attr('pointer-events', 'none');

        // 매 tick마다 위치 업데이트
        simulation.on('tick', () => {
          link
            .attr('x1', (d: any) => (d.source as GraphNode).x ?? 0)
            .attr('y1', (d: any) => (d.source as GraphNode).y ?? 0)
            .attr('x2', (d: any) => (d.target as GraphNode).x ?? 0)
            .attr('y2', (d: any) => (d.target as GraphNode).y ?? 0);

          nodeGroup.attr(
            'transform',
            (d) => `translate(${d.x ?? 0},${d.y ?? 0})`
          );
        });

        return () => {
          simulation.stop();
        };
      } catch (e) {
        console.warn('[WikiGraph] D3 로드 실패:', (e as Error).message);
      }
    };

    void renderGraph();
  }, [graphData]);

  const TYPE_LABELS: Record<string, string> = {
    manual: '수동',
    auto_generated: '자동 생성',
    faq: 'FAQ',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Wiki Graph View</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {graphData ? `${graphData.nodes.length}개 노드, ${graphData.links.length}개 링크` : ''}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* 범례 */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <span key={type} className="flex items-center gap-1">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ backgroundColor: color }}
                />
                {TYPE_LABELS[type]}
              </span>
            ))}
          </div>
          <a
            href={`/bot/${botId}/wiki`}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
          >
            목록으로
          </a>
        </div>
      </div>

      {/* 메인 영역 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 그래프 캔버스 */}
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              그래프 로딩 중...
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center text-red-500">
              {error}
            </div>
          )}
          {!loading && !error && graphData && graphData.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              위키 페이지가 없습니다.
            </div>
          )}
          <svg
            ref={svgRef}
            className="w-full h-full"
            style={{ minHeight: '600px' }}
          />
        </div>

        {/* 노드 상세 패널 */}
        {selected && (
          <div className="w-72 bg-white border-l p-4 flex-shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">페이지 정보</h3>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500 text-xs">제목</span>
                <p className="font-medium text-gray-900">{selected.title}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">슬러그</span>
                <p className="text-gray-700 font-mono text-xs">{selected.slug}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">타입</span>
                <p>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: `${NODE_COLORS[selected.page_type]}20`,
                      color: NODE_COLORS[selected.page_type],
                    }}
                  >
                    {TYPE_LABELS[selected.page_type]}
                  </span>
                </p>
              </div>
              <div className="flex gap-4">
                <div>
                  <span className="text-gray-500 text-xs">조회수</span>
                  <p className="font-medium">{selected.view_count}</p>
                </div>
                <div>
                  <span className="text-gray-500 text-xs">품질</span>
                  <p className="font-medium">
                    {selected.quality_score > 0
                      ? `${Math.round(selected.quality_score * 100)}%`
                      : '-'}
                  </p>
                </div>
              </div>
              <a
                href={`/bot/${botId}/wiki`}
                className="block mt-3 px-3 py-1.5 text-xs text-center bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
              >
                위키 목록에서 보기
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
