/**
 * @task S4SC1
 * @description Public client config endpoint — returns non-sensitive env vars for browser use.
 * Supabase anon key is intentionally public (RLS enforced).
 * Never expose OPENROUTER_API_KEY or service-role keys here.
 */
export default function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
  });
}
