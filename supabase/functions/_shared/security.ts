export function json(data: unknown, status = 200, headers: Record<string,string> = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type':'application/json', 'x-content-type-options':'nosniff', 'cache-control':'no-store', ...headers } });
}
export function requireEnv(name: string) { const value = Deno.env.get(name); if (!value) throw new Error(`Missing environment variable: ${name}`); return value; }
