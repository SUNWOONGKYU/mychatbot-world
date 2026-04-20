# Wiki-e-RAG Architecture

## Overview

Wiki-e-RAG (Wiki-Enriched Retrieval-Augmented Generation) is a system that automatically builds and maintains a structured wiki knowledge base from uploaded documents. It augments the standard RAG pipeline by prioritizing curated wiki pages over raw chunk embeddings during chat queries.

---

## 3-Storage Architecture

Wiki-e-RAG uses three complementary storage layers:

```
┌───────────────────────────────────────────────────────────────┐
│                    3-Storage Architecture                      │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  [1] Local Folder (Originals)                                 │
│      ├── Purpose: Preserve original uploaded files            │
│      ├── Location: Supabase Storage bucket (kb_files)         │
│      └── Contents: PDFs, images, DOCX, TXT files             │
│                                                               │
│  [2] Obsidian Vault (Wiki Markdown)                           │
│      ├── Purpose: Human-readable wiki pages in Markdown       │
│      ├── Format: YAML frontmatter + Markdown body             │
│      ├── Links: [[wikilink]] style cross-references           │
│      └── Export: /api/wiki/vault/export → .md files           │
│                                                               │
│  [3] Supabase (Vectors + Wiki Copy)                           │
│      ├── Table: wiki_pages (structured wiki data)             │
│      ├── Embeddings: pgvector cosine similarity search        │
│      ├── RPC: match_wiki_pages (similarity threshold 0.75)    │
│      └── Purpose: Fast vector retrieval for chat queries      │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### wiki_pages Table Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `bot_id` | uuid | Owner chatbot |
| `slug` | text | URL-friendly unique identifier |
| `title` | text | Wiki page title |
| `content` | text | Full markdown content |
| `page_type` | enum | `manual` / `auto_generated` / `faq` |
| `embedding` | vector(1536) | OpenAI text-embedding-3-small |
| `view_count` | int | Query hit counter |
| `quality_score` | float | 0.0–1.0 content quality |
| `is_stale` | bool | Stale detection flag |
| `source_kb_item_id` | uuid | FK to kb_items |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

---

## 5-Stage Ingest Pipeline

When a KB document is embedded, the wiki ingest pipeline runs automatically:

```
┌─────────────────────────────────────────────────────────────┐
│  Stage 1: Content Extraction                                │
│  └── PDF/image → OCR (GPT-4o Vision) → raw text            │
│      Plain text/DOCX → direct extraction                    │
├─────────────────────────────────────────────────────────────┤
│  Stage 2: Topic Segmentation                                │
│  └── LLM analyzes text → identifies distinct topics         │
│      Each topic → candidate wiki page                       │
├─────────────────────────────────────────────────────────────┤
│  Stage 3: Wiki Page Generation                              │
│  └── LLM generates structured wiki markdown per topic       │
│      Format: ## Title + body paragraphs + [[wikilinks]]     │
├─────────────────────────────────────────────────────────────┤
│  Stage 4: Slug Generation & Deduplication                   │
│  └── title → kebab-case slug                                │
│      Check: does slug already exist for this bot?           │
│      If yes → update existing page (merge/replace)          │
│      If no → insert new page                                │
├─────────────────────────────────────────────────────────────┤
│  Stage 5: Embedding & Storage                               │
│  └── Generate embedding for wiki page content               │
│      Upsert wiki_pages record with vector                   │
│      Response: { wiki_pages_created, wiki_pages_updated }   │
└─────────────────────────────────────────────────────────────┘
```

**Trigger Point:** Automatically fired after `POST /api/kb/embed` completes successfully (fire-and-forget).

---

## Wiki-First Query Pattern

The chat API follows a "Wiki-First" retrieval strategy:

```
User Question
     │
     ▼
Generate Query Embedding
(text-embedding-3-small)
     │
     ▼
┌────────────────────────────┐
│  match_wiki_pages RPC      │
│  threshold: 0.75           │
│  match_count: 3            │
└────────────┬───────────────┘
             │
    ┌────────┴────────┐
    │ similarity      │ similarity
    │ >= 0.75 (HIT)   │ < 0.75 (MISS)
    ▼                 ▼
Wiki Content      KB Chunk Search
as system         (persona-loader
context           kb_embeddings)
    │                 │
    └────────┬────────┘
             │
             ▼
    ragSource field set:
    'wiki' | 'chunk' | 'none'
             │
             ▼
    LLM Response (streaming SSE)
             │
             ▼
    Async: POST /api/wiki/accumulate
    (fire-and-forget, non-blocking)
```

### ragSource Values

| Value | Meaning | Badge Color |
|-------|---------|-------------|
| `'wiki'` | Response sourced from wiki pages | Green (Wiki 기반) |
| `'chunk'` | Response sourced from KB chunk embeddings | Blue (KB 기반) |
| `'none'` | No RAG context found | No badge shown |

---

## Wiki Accumulation

After each chat response, good Q&A pairs are automatically accumulated as FAQ wiki pages:

```
Chat Response Sent
     │
     ▼ (async, non-blocking)
POST /api/wiki/accumulate
{bot_id, question, answer}
     │
     ▼
Quality Check:
  - answer length >= threshold
  - not chitchat/greeting
  - not duplicate existing FAQ
     │
    Pass? ──No──→ { accumulated: false, reason: '...' }
     │
    Yes
     │
     ▼
Generate FAQ Wiki Page:
  - slug: "faq-{question-slug}"
  - page_type: "faq"
  - content: Q&A formatted markdown
     │
     ▼
Embed + Upsert wiki_pages
     │
     ▼
{ accumulated: true, wiki_page_slug: '...' }
```

---

## Obsidian Graph View

The graph view (`/api/wiki/vault/graph`) provides a D3.js force-directed visualization of wiki page relationships:

- **Nodes**: Wiki pages (radius scales with `view_count`)
- **Edges**: `[[wikilink]]` references parsed from page content
- **Virtual edges**: Pages of same `page_type` connected when no explicit links exist

D3.js is loaded via CDN (no npm dependency) to avoid build-time package requirements.

---

## Security & Access Control

### RLS Policies (wiki_pages table)

| Operation | Policy |
|-----------|--------|
| SELECT | Public (any anon/authenticated) |
| INSERT | Bot ownership required (`bot_id` must match authenticated user's bot) |
| UPDATE | Bot ownership required |
| DELETE | Bot ownership required |

### Obsidian Vault Sync

`POST /api/wiki/vault/sync` accepts markdown files with YAML frontmatter:

```yaml
---
slug: machine-learning-overview
title: Machine Learning Overview
page_type: manual
bot_id: {uuid}
---
# Machine Learning Overview
Content here...
```

The sync endpoint upserts by `slug + bot_id`, preserving existing embeddings when content hasn't changed.
