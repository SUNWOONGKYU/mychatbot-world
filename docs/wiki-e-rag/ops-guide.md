# Wiki-e-RAG Operations Guide

## Contents

1. [Wiki Ingest — How to Build Your Wiki](#1-wiki-ingest--how-to-build-your-wiki)
2. [Wiki Lint — Running Quality Checks](#2-wiki-lint--running-quality-checks)
3. [Graph View — Visualizing Wiki Structure](#3-graph-view--visualizing-wiki-structure)
4. [Obsidian Vault Sync](#4-obsidian-vault-sync)
5. [Monitoring & Troubleshooting](#5-monitoring--troubleshooting)

---

## 1. Wiki Ingest — How to Build Your Wiki

### Method A: Automatic (Recommended)

Wiki pages are generated automatically whenever a KB document is embedded. No manual action required.

**Flow:**
1. Upload a document in the KB Manager
2. Click "임베드" to embed the document
3. The embed API (`POST /api/kb/embed`) triggers wiki ingest automatically
4. Wiki pages appear in `/bot/{botId}/wiki` within seconds

The response from the embed API includes `wiki_ingest_triggered: true` to confirm the trigger.

---

### Method B: Manual (Per KB Item)

Trigger wiki generation for a specific already-embedded KB item.

**Via UI:**
1. Go to the KB Manager (home page)
2. Find the KB item (must be embedded — "임베드됨" status)
3. Click the "위키 생성" button
4. A loading indicator appears; a success/failure message follows

**Via API:**

```bash
curl -X POST https://your-domain.com/api/wiki/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "bot_id": "your-bot-uuid",
    "kb_item_id": "kb-item-uuid"
  }'
```

Expected response:

```json
{
  "success": true,
  "data": {
    "wiki_pages_created": 3,
    "wiki_pages_updated": 0,
    "generated_slugs": ["intro-to-topic", "key-concepts", "faq-overview"]
  }
}
```

---

### Viewing Generated Wiki Pages

Navigate to `/bot/{botId}/wiki` to see all wiki pages.

**Filter options:**
- **All** — Show all page types
- **Manual** — Manually created pages
- **Auto Generated** — LLM-generated from KB docs
- **FAQ** — Accumulated from chat Q&A

**Search:** Use the search box to find pages by title.

**Page Detail:** Click any page row to see full content in a modal.

---

### Understanding Page Types

| Type | Source | When Created |
|------|--------|-------------|
| `manual` | Human-written | When a user writes a page directly |
| `auto_generated` | LLM from KB doc | After KB embed (automatic or manual trigger) |
| `faq` | Chat accumulation | When good Q&A pairs meet quality threshold |

---

## 2. Wiki Lint — Running Quality Checks

The Lint dashboard detects three categories of wiki issues:

| Issue | Description | Action |
|-------|-------------|--------|
| Orphan pages | Pages with 0 view count (never accessed) | Review and delete if irrelevant |
| Stale pages | Pages not updated in 30+ days | Re-ingest source KB or update manually |
| Conflicts | Duplicate titles or overlapping content | Merge or rename affected pages |

---

### Running Lint via UI

1. Navigate to `/bot/{botId}/wiki/lint`
2. Click "Lint 실행" button
3. Results appear in three sections: Orphan Pages, Stale Pages, Conflicts
4. Review each section and take appropriate action

**History table** at the bottom shows past lint runs with counts.

---

### Running Lint via API

```bash
# Run lint
curl -X POST https://your-domain.com/api/wiki/lint \
  -H "Content-Type: application/json" \
  -d '{"bot_id": "your-bot-uuid"}'

# Run lint with auto-fix
curl -X POST https://your-domain.com/api/wiki/lint \
  -H "Content-Type: application/json" \
  -d '{"bot_id": "your-bot-uuid", "auto_fix": true}'

# Get lint history
curl "https://your-domain.com/api/wiki/lint?bot_id=your-bot-uuid&limit=10"
```

---

### Recommended Lint Schedule

| Frequency | Trigger | Condition |
|-----------|---------|-----------|
| After bulk import | Manual | After uploading 10+ KB items |
| Weekly | Scheduled or manual | Routine maintenance |
| After re-embedding | Automatic | When KB items are re-processed |

---

### Interpreting Lint Results

**Orphan Pages**

Pages with `view_count: 0` that have never been accessed via chat queries. This may indicate:
- Topic not relevant to user queries
- Page covered by a better-scoring page
- Ingest produced redundant pages

**Recommended action:** Delete or merge into related pages.

**Stale Pages**

Pages where `days_since_update >= 30`. Indicates:
- Source KB document may have been updated
- Underlying knowledge may be outdated

**Recommended action:** Re-trigger ingest for the source KB item or update content manually.

**Conflict Groups**

Pages sharing the same title or with high content overlap. Indicates:
- Multiple KB items covering the same topic
- Duplicate ingest runs

**Recommended action:** Merge content into one canonical page, delete the duplicate.

---

## 3. Graph View — Visualizing Wiki Structure

The Graph View provides a force-directed visualization of wiki page relationships at `/bot/{botId}/wiki/graph`.

---

### Reading the Graph

**Nodes:**
- Each circle represents one wiki page
- Node size scales with `view_count` (frequently accessed pages are larger)
- Hover or click a node to see page details in the side panel

**Edges:**
- Solid lines: explicit `[[wikilink]]` references in page content
- Dashed lines: virtual links auto-generated between pages of the same `page_type`

**Node colors** (by page_type):
- Blue: `manual`
- Green: `auto_generated`
- Orange: `faq`

---

### Interacting with the Graph

| Interaction | Action |
|-------------|--------|
| Scroll | Zoom in/out |
| Click + drag background | Pan |
| Click a node | Show page detail in side panel |
| Drag a node | Reposition in layout |

---

### Graph Data API

The graph fetches from `GET /api/wiki/vault/graph?bot_id={botId}`.

```json
{
  "nodes": [
    { "id": "page-slug", "title": "Page Title", "page_type": "auto_generated", "view_count": 12 }
  ],
  "links": [
    { "source": "page-a", "target": "page-b", "type": "wikilink" }
  ]
}
```

**Note:** D3.js is loaded from CDN at runtime. No npm install required.

---

### When the Graph Appears Empty

- Bot has fewer than 2 wiki pages → Graph shows no edges
- All pages have 0 view_count → All nodes appear the same size
- No `[[wikilink]]` patterns in content → Only virtual edges shown (same page_type groups)

**Resolution:** Generate more wiki pages via ingest, or add `[[slug]]` references in manual pages.

---

## 4. Obsidian Vault Sync

Wiki-e-RAG supports bidirectional sync with Obsidian.

---

### Export: Supabase → Obsidian

Download all wiki pages as Obsidian-compatible markdown files.

**Via API:**

```bash
curl -X POST https://your-domain.com/api/wiki/vault/export \
  -H "Content-Type: application/json" \
  -d '{"bot_id": "your-bot-uuid"}' \
  -o wiki-export.json
```

The response is a JSON array of `{filename, content}` objects. Each `content` is a valid Obsidian markdown file with YAML frontmatter.

**Manual steps to open in Obsidian:**
1. Create a new Obsidian vault folder
2. Save each file using the `filename` value
3. Open the folder as an Obsidian vault
4. The `[[wikilinks]]` will be automatically resolved by Obsidian

---

### Import: Obsidian → Supabase

After editing pages in Obsidian, sync changes back.

```bash
curl -X POST https://your-domain.com/api/wiki/vault/sync \
  -H "Content-Type: application/json" \
  -d '{
    "bot_id": "your-bot-uuid",
    "files": [
      {
        "filename": "machine-learning.md",
        "content": "---\nslug: machine-learning\ntitle: Machine Learning\npage_type: manual\n---\n\n# Machine Learning\n\nUpdated content..."
      }
    ]
  }'
```

Response:

```json
{
  "success": true,
  "data": { "synced": 1, "created": 0, "updated": 1, "errors": [] }
}
```

**Sync rules:**
- Pages matched by `slug + bot_id`
- Content change → embedding regenerated automatically
- New slugs → new pages created
- `page_type` in frontmatter preserved

---

## 5. Monitoring & Troubleshooting

### Wiki Ingest Failures

**Symptom:** KB embed succeeds but no wiki pages appear.

**Diagnosis:**
1. Check server logs for errors from `/api/wiki/ingest`
2. Verify the KB item has `is_embedded: true` in Supabase
3. Check that `OPENAI_API_KEY` environment variable is set

**Common causes:**
- OpenAI API rate limit hit during LLM generation
- KB content too short (< 100 chars) → ingest skipped
- Embedding dimension mismatch in `wiki_pages` table

---

### Chat Not Using Wiki (ragSource always "chunk")

**Symptom:** Chat responses show "KB 기반" badge even for topics covered in wiki.

**Diagnosis:**
1. Check wiki pages exist: `GET /api/wiki/pages?bot_id={botId}`
2. Check wiki page quality scores (should be > 0.5)
3. Verify embeddings exist: query `wiki_pages` where `embedding IS NOT NULL`

**Threshold adjustment:**

The default similarity threshold is `0.75`. If queries consistently miss:
- Lower threshold → more wiki hits (but potentially less precise)
- Raise threshold → fewer wiki hits (more precise)

The threshold is set in `app/api/chat/route.ts` in the `searchWiki()` call:
```typescript
const wikiResult = await searchWiki(botId, queryEmbedding, 0.75, 3);
```

---

### Accumulation Not Happening

**Symptom:** Chat responses are good but no FAQ pages are created.

**Diagnosis:**
1. Check `/api/wiki/accumulate` logs (it runs async — check server logs)
2. Verify the answer meets minimum length (default: 100 chars)
3. Check for chitchat classification false positives

**Note:** Accumulation is fire-and-forget. Failures are logged as `console.warn` and do not surface to the user.

---

### Lint Shows Many Stale Pages After Initial Setup

This is expected behavior immediately after initial KB import. The wiki system needs time for user queries to "warm up" page view counts.

Run lint again after 1–2 weeks of active usage to get meaningful stale detection results.

---

### Environment Variables Required

| Variable | Used By | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | Ingest, OCR, Accumulate | Wiki LLM generation + embeddings |
| `NEXT_PUBLIC_SUPABASE_URL` | All wiki APIs | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All wiki APIs | Supabase anon key |
| `NEXTAUTH_URL` | Accumulate (async fetch) | Base URL for internal API calls |
