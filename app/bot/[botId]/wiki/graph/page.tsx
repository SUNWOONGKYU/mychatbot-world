/**
 * @task S5FE5
 * @modified-by S11FE8 (2026-04-21): 터치타겟 44px + S7 semantic tokens
 * @description Obsidian Graph View — force-directed 위키 링크 그래프 (Canvas + CDN D3)
 *
 * 경로: /bot/[botId]/wiki/graph
 * 기능:
 *  - GET /api/wiki/vault/graph → 노드(wiki_pages) + 링크(slug 참조) 데이터
 *  - D3.js CDN 동적 로드 + Canvas 렌더링
 *  - 노드 색상: page_type별 구분
 *  - 클릭 시 위키 상세 정보 사이드 패널
 *  - 줌/패닝 지원
 */

'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState, useCallback } from 'react';
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
  manual: '#3b82f6',
  auto_generated: '#10b981',
  faq: '#f59e0b',
};

const TYPE_LABELS: Record<string, string> = {
  manual: '수동',
  auto_generated: '자동 생성',
  faq: 'FAQ',
};

// ============================
// D3 CDN 동적 로드
// ============================

declare global {
  interface Window {
    d3?: any;
  }
}

function loadD3(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.d3) {
      resolve(window.d3);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js';
    script.onload = () => resolve(window.d3);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

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
  const simulationRef = useRef<any>(null);

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
  const renderGraph = useCallback(async () => {
    if (!graphData || !svgRef.current) return;

    try {
      const d3 = await loadD3();
      const svgEl = svgRef.current;
      const svg = d3.select(svgEl);
      svg.selectAll('*').remove();

      if (simulationRef.current) {
        simulationRef.current.stop();
      }

      const width = svgEl.clientWidth || 800;
      const height = svgEl.clientHeight || 600;

      const zoomGroup = svg.append('g');
      svg.call(
        d3.zoom()
          .scaleExtent([0.3, 3])
          .on('zoom', (event: any) => {
            zoomGroup.attr('transform', event.transform);
          })
      );

      const nodes: GraphNode[] = graphData.nodes.map((n) => ({ ...n }));
      const links: GraphLink[] = graphData.links.map((l) => ({ ...l }));

      const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id((d: any) => d.id).distance(80))
        .force('charge', d3.forceManyBody().strength(-200))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide(14));

      simulationRef.current = simulation;

      // 링크
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
        .on('click', (_ev: any, d: any) => {
          setSelected(d as GraphNode);
        })
        .call(
          d3.drag()
            .on('start', (event: any, d: any) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            })
            .on('drag', (event: any, d: any) => {
              d.fx = event.x;
              d.fy = event.y;
            })
            .on('end', (event: any, d: any) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            })
        );

      nodeGroup
        .append('circle')
        .attr('r', (d: any) => 8 + Math.min((d.view_count ?? 0) / 10, 6))
        .attr('fill', (d: any) => NODE_COLORS[d.page_type] ?? '#6b7280')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

      // 라벨 색상을 현재 테마의 text-primary로 동적 추출 (라이트/다크 모두 대비 확보)
      const labelColor = (() => {
        try {
          const rgbStr = getComputedStyle(document.documentElement)
            .getPropertyValue('--text-primary-rgb')
            .trim();
          return rgbStr ? `rgb(${rgbStr})` : '#374151';
        } catch {
          return '#374151';
        }
      })();

      nodeGroup
        .append('text')
        .text((d: any) =>
          d.title.length > 20 ? d.title.slice(0, 18) + '…' : d.title
        )
        .attr('x', 14)
        .attr('y', 4)
        .attr('font-size', '11px')
        .attr('fill', labelColor)
        .attr('pointer-events', 'none');

      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x ?? 0)
          .attr('y1', (d: any) => d.source.y ?? 0)
          .attr('x2', (d: any) => d.target.x ?? 0)
          .attr('y2', (d: any) => d.target.y ?? 0);

        nodeGroup.attr(
          'transform',
          (d: any) => `translate(${d.x ?? 0},${d.y ?? 0})`
        );
      });
    } catch (e) {
      console.warn('[WikiGraph] D3 렌더링 실패:', (e as Error).message);
      setError('그래프 렌더링에 실패했습니다. CDN 연결을 확인하세요.');
    }
  }, [graphData]);

  useEffect(() => {
    void renderGraph();
    return () => {
      simulationRef.current?.stop();
    };
  }, [renderGraph]);

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-base))] flex flex-col">
      {/* 헤더 */}
      <div className="bg-[rgb(var(--bg-surface))] border-b border-[rgb(var(--border))] px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-[rgb(var(--text-primary-rgb))]">Wiki Graph View</h1>
          <p className="text-sm text-[rgb(var(--text-secondary-rgb))] mt-0.5">
            {graphData
              ? `${graphData.nodes.length}개 노드, ${graphData.links.length}개 링크`
              : ''}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs text-[rgb(var(--text-secondary-rgb))]">
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
            className="inline-flex items-center min-h-[44px] px-3 py-1.5 text-sm border border-[rgb(var(--border))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary-rgb))] rounded-lg hover:bg-[rgb(var(--bg-subtle))]"
          >
            목록으로
          </a>
        </div>
      </div>

      {/* 메인 */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-[rgb(var(--text-secondary-rgb))]">
              그래프 로딩 중...
            </div>
          )}
          {error && (
            <div
              className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm"
              style={{ color: 'var(--state-danger-fg)' }}
            >
              {error}
            </div>
          )}
          {!loading && !error && graphData && graphData.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-[rgb(var(--text-secondary-rgb))]">
              위키 페이지가 없습니다.
            </div>
          )}
          <svg ref={svgRef} className="w-full h-full" style={{ minHeight: '600px' }} />
        </div>

        {selected && (
          <div className="w-72 bg-[rgb(var(--bg-surface))] border-l border-[rgb(var(--border))] p-4 flex-shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[rgb(var(--text-primary-rgb))] text-sm">페이지 정보</h3>
              <button onClick={() => setSelected(null)} className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] text-[rgb(var(--text-secondary-rgb))] hover:text-[rgb(var(--text-primary-rgb))] rounded">
                ×
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-[rgb(var(--text-muted))] text-xs">제목</span>
                <p className="font-medium text-[rgb(var(--text-primary-rgb))]">{selected.title}</p>
              </div>
              <div>
                <span className="text-[rgb(var(--text-muted))] text-xs">슬러그</span>
                <p className="text-[rgb(var(--text-secondary-rgb))] font-mono text-xs">{selected.slug}</p>
              </div>
              <div>
                <span className="text-[rgb(var(--text-muted))] text-xs">타입</span>
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
                  <span className="text-[rgb(var(--text-muted))] text-xs">조회수</span>
                  <p className="font-medium text-[rgb(var(--text-primary-rgb))]">{selected.view_count}</p>
                </div>
                <div>
                  <span className="text-[rgb(var(--text-muted))] text-xs">품질</span>
                  <p className="font-medium text-[rgb(var(--text-primary-rgb))]">
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
