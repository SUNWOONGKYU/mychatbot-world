# Wiki-e-RAG API Reference

All endpoints are Next.js App Router route handlers under `app/api/wiki/`.

---

## Wiki Pages

### GET /api/wiki/pages

List wiki pages for a bot.

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bot_id` | string | Yes | Bot UUID |
| `page_type` | string | No | Filter: `manual`, `auto_generated`, `faq` |
| `search` | string | No | Full-text search query |
| `limit` | number | No | Default: 50, Max: 100 |
| `offset` | number | No | Pagination offset |

**Response**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "slug": "machine-learning-overview",
      "title": "Machine Learning Overview",
      "content": "## Introduction\n...",
      "page_type": "auto_generated",
      "view_count": 12,
      "quality_score": 0.85,
      "is_stale": false,
      "created_at": "2026-04-01T10:00:00Z",
      "updated_at": "2026-04-06T09:30:00Z"
    }
  ],
  "total": 42
}
```

---

### DELETE /api/wiki/pages

Delete a wiki page.

**Request Body**

```json
{
  "bot_id": "uuid",
  "page_id": "uuid"
}
```

**Response**

```json
{
  "success": true,
  "data": { "deleted": true }
}
```

**Error Responses**

| Status | Error |
|--------|-------|
| 400 | `bot_id` or `page_id` missing |
| 403 | Page does not belong to bot |
| 404 | Page not found |

---

## Wiki Ingest

### POST /api/wiki/ingest

Trigger wiki page generation from a KB item.

**Request Body**

```json
{
  "bot_id": "uuid",
  "kb_item_id": "uuid"
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "bot_id": "uuid",
    "kb_item_id": "uuid",
    "wiki_pages_created": 3,
    "wiki_pages_updated": 1,
    "generated_slugs": [
      "intro-to-machine-learning",
      "neural-network-basics",
      "deep-learning-overview"
    ]
  }
}
```

**Notes**

- This endpoint is automatically called (fire-and-forget) after `POST /api/kb/embed` succeeds.
- Generated pages have `page_type: "auto_generated"`.
- Duplicate slugs are updated (merged), not duplicated.

**Error Responses**

| Status | Error |
|--------|-------|
| 400 | `bot_id` or `kb_item_id` missing |
| 404 | KB item not found or not embedded |

---

## Wiki Accumulate

### POST /api/wiki/accumulate

Evaluate a Q&A exchange and optionally save it as a FAQ wiki page.

**Request Body**

```json
{
  "bot_id": "uuid",
  "question": "How do I reset my password?",
  "answer": "To reset your password, navigate to Settings > Security..."
}
```

**Response (Accumulated)**

```json
{
  "success": true,
  "data": {
    "accumulated": true,
    "reason": "high_quality_answer",
    "wiki_page_slug": "faq-how-do-i-reset-my-password",
    "wiki_page_id": "uuid",
    "wiki_page_type": "faq"
  }
}
```

**Response (Not Accumulated)**

```json
{
  "success": true,
  "data": {
    "accumulated": false,
    "reason": "answer_too_short"
  }
}
```

**Reason Values**

| Reason | Description |
|--------|-------------|
| `high_quality_answer` | Answer meets quality threshold, accumulated |
| `new_faq_created` | New FAQ wiki page created |
| `faq_updated` | Existing FAQ page updated |
| `answer_too_short` | Answer below minimum length threshold |
| `chitchat_excluded` | Exchange classified as chitchat |
| `duplicate_faq` | Similar FAQ already exists |

**Usage Note**

This endpoint is called asynchronously (fire-and-forget) from `POST /api/chat` after each response. Failures do not affect chat response delivery.

---

## Wiki Lint

### POST /api/wiki/lint

Run lint analysis on wiki pages for a bot.

**Request Body**

```json
{
  "bot_id": "uuid",
  "auto_fix": false
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "bot_id": "uuid",
    "run_at": "2026-04-06T10:30:00Z",
    "total_pages_scanned": 25,
    "orphan_pages": [
      {
        "slug": "abandoned-topic",
        "title": "Abandoned Topic",
        "view_count": 0,
        "last_viewed": null
      }
    ],
    "stale_pages": [
      {
        "slug": "old-api-guide",
        "title": "Old API Guide",
        "updated_at": "2026-02-01T00:00:00Z",
        "days_since_update": 64,
        "is_stale": true
      }
    ],
    "conflict_groups": [
      {
        "conflict_type": "duplicate_title",
        "pages": [
          { "slug": "setup-guide-v1", "title": "Setup Guide" },
          { "slug": "setup-guide-v2", "title": "Setup Guide" }
        ]
      }
    ],
    "fixed_count": 0
  }
}
```

**Conflict Types**

| Type | Description |
|------|-------------|
| `duplicate_title` | Two or more pages share the same title |
| `overlapping_content` | High content similarity between pages |
| `broken_link` | `[[wikilink]]` referencing a non-existent slug |
| `circular_reference` | A → B → A link chain |

---

### GET /api/wiki/lint

Retrieve lint run history.

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bot_id` | string | Yes | Bot UUID |
| `limit` | number | No | Default: 10, Max: 50 |

**Response**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "bot_id": "uuid",
      "run_at": "2026-04-06T10:00:00Z",
      "orphan_count": 2,
      "stale_count": 1,
      "conflict_count": 0,
      "fixed_count": 0
    }
  ]
}
```

---

## Obsidian Vault

### POST /api/wiki/vault/export

Export all wiki pages as Obsidian-compatible markdown files.

**Request Body**

```json
{
  "bot_id": "uuid"
}
```

**Response**

```json
{
  "success": true,
  "data": [
    {
      "filename": "machine-learning-overview.md",
      "slug": "machine-learning-overview",
      "title": "Machine Learning Overview",
      "content": "---\nslug: machine-learning-overview\ntitle: Machine Learning Overview\npage_type: auto_generated\nbot_id: uuid\ncreated_at: 2026-04-01\nupdated_at: 2026-04-06\n---\n\n# Machine Learning Overview\n\n..."
    }
  ]
}
```

**Markdown Format**

Each file uses YAML frontmatter followed by the page content:

```yaml
---
slug: {slug}
title: {title}
page_type: manual | auto_generated | faq
bot_id: {uuid}
created_at: YYYY-MM-DD
updated_at: YYYY-MM-DD
---

# {title}

{content body with [[wikilinks]]}
```

---

### POST /api/wiki/vault/sync

Import markdown files back into the wiki (Obsidian → Supabase sync).

**Request Body**

```json
{
  "bot_id": "uuid",
  "files": [
    {
      "filename": "machine-learning-overview.md",
      "content": "---\nslug: machine-learning-overview\n...\n---\n\n# Content..."
    }
  ]
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "synced": 5,
    "created": 2,
    "updated": 3,
    "errors": []
  }
}
```

**Sync Behavior**

- Identifies pages by `slug + bot_id`
- Existing pages: content updated, embedding regenerated
- New pages: inserted with fresh embedding
- YAML frontmatter parsed for metadata

---

### GET /api/wiki/vault/graph

Get graph data for Obsidian Graph View visualization.

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bot_id` | string | Yes | Bot UUID |

**Response**

```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "machine-learning-overview",
        "title": "Machine Learning Overview",
        "page_type": "auto_generated",
        "view_count": 12
      }
    ],
    "links": [
      {
        "source": "machine-learning-overview",
        "target": "deep-learning-basics",
        "type": "wikilink"
      }
    ]
  }
}
```

**Link Types**

| Type | Description |
|------|-------------|
| `wikilink` | Explicit `[[slug]]` reference in content |
| `virtual` | Auto-generated link between pages of same `page_type` |

---

## Error Response Format

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

### Common HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad Request (missing/invalid parameters) |
| 401 | Unauthorized |
| 403 | Forbidden (wrong bot ownership) |
| 404 | Resource Not Found |
| 500 | Internal Server Error |
