/**
 * Canadian University of Nigeria — production configuration.
 * Never place a Supabase service-role key or payment secret in this file.
 */
window.CUN_CONFIG = {
  useSupabase: true,
  supabaseUrl: "",
  supabaseAnonKey: "",
  siteName: "Canadian University of Nigeria",
  siteUrl: "https://www.cun.edu.ng/",
  demoMode: false,
  allowDemoAccounts: false,
  paymentProvider: "paystack",
  paymentPublicKey: "",
  storageBucket: "application-documents",
  loginRedirect: {
    student: "student-portal.html",
    staff: "staff-portal.html",
    admin: "admin.html"
  }
};
