/**
 * CUN Website Configuration
 * Demo mode works without Supabase. Do NOT put service-role keys here.
 */

window.CUN_CONFIG = {
  // Set to true and fill keys when Supabase project is ready
  useSupabase: false,
  supabaseUrl: "YOUR_SUPABASE_URL",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",

  // Site
  siteName: "Canadian University of Nigeria",
  siteUrl: "", // set for production canonicals
  demoMode: true,

  // Paths
  loginRedirect: {
    student: "student-portal.html",
    staff: "staff-portal.html",
    admin: "admin.html"
  }
};
