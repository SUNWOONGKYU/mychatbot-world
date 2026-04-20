#!/usr/bin/env bun
/**
 * CPC Channel — Claude Code Channels 기반 CPC 명령 수신/응답
 *
 * 기존 cc_inject.py(ConPTY 해킹) 대체:
 *   Supabase 폴링 → notifications/claude/channel 푸시 → Claude 처리 → cpc_reply 도구
 *
 * 실행: claude --channels server:cpc-channel
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ─── CPC API (mychatbot.world 프록시 경유) ───
const CPC_PROXY = "https://mychatbot.world/api/cpc-proxy";

function cpcUrl(apiPath: string): string {
  return `${CPC_PROXY}?path=${encodeURIComponent(apiPath)}`;
}

async function cpcGet(apiPath: string): Promise<any> {
  const res = await fetch(cpcUrl(apiPath), {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`CPC GET ${res.status}: ${apiPath}`);
  return res.json();
}

async function cpcPatch(apiPath: string, body: Record<string, any>): Promise<any> {
  const res = await fetch(cpcUrl(apiPath), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`CPC PATCH ${res.status}: ${apiPath}`);
  return res.json();
}

// ─── 소대 ID 자동 감지 ───
function detectPlatoonId(): string {
  const cwd = process.cwd().replace(/\\/g, "/");
  if (cwd.includes("mychatbot-world")) return "mychatbot-1";
  if (cwd.includes("SSAL_Works_Private") || cwd.includes("ssalworks")) return "ssalworks-1";
  if (cwd.includes("AI_Study_Circle") || cwd.includes("studycircle")) return "studycircle-1";
  if (cwd.includes("PoliticianFinder") || cwd.includes("politician")) return "politician-1";
  if (cwd.includes("ValueLink") || cwd.includes("valuelink")) return "valuelink-1";
  return "mychatbot-1";
}

const PLATOON_ID = detectPlatoonId();
const POLL_INTERVAL_MS = 2000; // 2초 폴링
let pollTimer: ReturnType<typeof setInterval> | null = null;

// ─── MCP Server (Channels 지원) ───
const server = new Server(
  { name: "cpc-channel", version: "1.0.0" },
  {
    capabilities: {
      experimental: { "claude/channel": {} },
      tools: {},
    },
    instructions: `
CPC(Claude Platoons Control) 채널입니다. 소대 ID: ${PLATOON_ID}

웹챗봇에서 보낸 명령이 이 채널을 통해 도착합니다.
메시지 형식:
<channel source="cpc-command" cmd_id="..." platoon_id="...">
{명령 텍스트}
</channel>

처리 방법:
1. 메시지 내용을 읽고 요청된 작업을 수행하세요.
2. 완료 후 반드시 cpc_reply 도구를 호출하여 응답을 보내세요.
   - cmd_id: 채널 메시지의 cmd_id 값
   - result: 처리 결과 텍스트
3. cpc_reply를 호출하면 웹챗봇에 응답이 자동으로 표시됩니다.

주의:
- 각 명령마다 반드시 cpc_reply로 응답해야 합니다. 응답하지 않으면 웹챗봇이 타임아웃됩니다.
- 간단한 인사/질문도 cpc_reply로 응답하세요.
`.trim(),
  }
);

// ─── 도구: cpc_reply ───
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "cpc_reply",
      description:
        "CPC 명령에 대한 응답을 웹챗봇에 전달합니다. " +
        "채널로 받은 명령의 cmd_id와 처리 결과를 전달하세요. " +
        "연락병 웹챗봇에 result 텍스트가 표시됩니다.",
      inputSchema: {
        type: "object" as const,
        properties: {
          cmd_id: {
            type: "string",
            description: "CPC 명령 ID (채널 메시지의 cmd_id)",
          },
          result: {
            type: "string",
            description: "처리 결과 텍스트 (웹챗봇에 표시됨)",
          },
        },
        required: ["cmd_id", "result"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name === "cpc_reply") {
    const { cmd_id, result } = req.params.arguments as {
      cmd_id: string;
      result: string;
    };
    try {
      await cpcPatch(`/api/commands/${cmd_id}/done`, { result });
      return {
        content: [{ type: "text" as const, text: `CPC 응답 전달 완료 (${cmd_id})` }],
        isError: false,
      };
    } catch (e: any) {
      return {
        content: [{ type: "text" as const, text: `CPC 응답 실패: ${e.message}` }],
        isError: true,
      };
    }
  }
  throw new Error(`Unknown tool: ${req.params.name}`);
});

// ─── Supabase 폴링 → Channel 이벤트 푸시 ───
async function pollAndPush() {
  try {
    const data = await cpcGet(
      `/api/platoons/${PLATOON_ID}/commands?status=PENDING`
    );
    const cmds = Array.isArray(data) ? data : data?.data || [];

    for (const cmd of cmds) {
      const cmdId = cmd.id || cmd.command_id || "";
      const cmdText = cmd.command || cmd.text || "";

      // ACK 처리
      try {
        await cpcPatch(`/api/commands/${cmdId}/ack`, {});
      } catch {
        // ACK 실패해도 알림은 보냄
      }

      // Channel 이벤트 푸시 → Claude에게 알림
      try {
        await server.notification({
          method: "notifications/claude/channel",
          params: {
            channel: "cpc-command",
            content: cmdText,
            meta: {
              cmd_id: cmdId,
              platoon_id: PLATOON_ID,
              source: cmd.source || "chatbot",
              created_at: cmd.created_at || new Date().toISOString(),
            },
          },
        });
      } catch (e: any) {
        // 연결 안 됐을 때 — 로그만 남기고 계속
        process.stderr.write(`[cpc-channel] push failed: ${e.message}\n`);
      }
    }
  } catch {
    // 네트워크 에러 — 다음 폴링에서 재시도
  }
}

// ─── 시작 ───
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // 폴링 시작
  pollTimer = setInterval(pollAndPush, POLL_INTERVAL_MS);
  process.stderr.write(
    `[cpc-channel] 시작: ${PLATOON_ID} | 폴링 ${POLL_INTERVAL_MS}ms\n`
  );

  // 종료 처리
  process.on("SIGINT", () => {
    if (pollTimer) clearInterval(pollTimer);
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    if (pollTimer) clearInterval(pollTimer);
    process.exit(0);
  });
}

main().catch((e) => {
  process.stderr.write(`[cpc-channel] fatal: ${e.message}\n`);
  process.exit(1);
});
