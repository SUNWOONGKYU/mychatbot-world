-- RPC function for atomic wiki page view count increment
-- Called by /api/chat/route.ts after fetching wiki context

CREATE OR REPLACE FUNCTION increment_wiki_view_count(page_ids UUID[])
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE wiki_pages
  SET view_count = view_count + 1
  WHERE id = ANY(page_ids);
$$;
