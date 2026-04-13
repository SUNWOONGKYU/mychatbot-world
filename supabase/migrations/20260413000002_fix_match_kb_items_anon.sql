-- S1DB3 Fix: Revoke unnecessary anon EXECUTE on match_kb_items
--
-- Issue: match_kb_items is SECURITY INVOKER and queries mcw_kb_items/kb_embeddings.
-- anon role has no SELECT policy on kb_embeddings, so anon calls would fail anyway.
-- Granting EXECUTE to anon on an INVOKER function with no underlying anon table access
-- violates least privilege principle (CWE-250).
--
-- Fix: Revoke anon EXECUTE. Only authenticated users need vector search.
-- Guest chat uses its own system prompt; no RAG needed for anon.

REVOKE EXECUTE ON FUNCTION match_kb_items(vector(1536), int, text) FROM anon;

-- Ensure authenticated role retains access (unchanged)
GRANT EXECUTE ON FUNCTION match_kb_items(vector(1536), int, text) TO authenticated;
