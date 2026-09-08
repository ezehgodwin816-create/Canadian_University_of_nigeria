# CUN Supabase connection

1. Open `js/config.js`.
2. Set `supabaseUrl` to the project URL, for example `https://YOUR_PROJECT.supabase.co` (do not add `/rest/v1`).
3. Set `supabaseAnonKey` to the browser-safe publishable/anon key.
4. Never place the service-role/secret key in this repository or any browser file.
5. Deploy the site over HTTPS.

The login page uses Supabase Auth. Applicants can create an account, sign in, and submit an application. Admin/student dashboards query Supabase directly through RLS.
