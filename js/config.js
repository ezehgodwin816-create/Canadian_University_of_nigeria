/**
 * Canadian University of Nigeria — browser-safe production configuration.
 * NEVER place a Supabase service-role/secret key here.
 */
window.CUN_CONFIG = {
  useSupabase: true,
  supabaseUrl: "https://zrsbzymipbixnutfjbkq.supabase.co",
  supabaseAnonKey: "sb_publishable_iz03xBmfWKid323pollPxg_nCBbD5Ex",
  siteName: "Canadian University of Nigeria",
  siteUrl: "https://www.cun.edu.ng/",
  demoMode: false,
  allowDemoAccounts: false,
  paymentProvider: "paystack",
  paymentPublicKey: "pk_test_b480176a27a72d14478858469d25067a2784e094",
  storageBucket: "application-documents",
  loginRedirect: { student:"student-portal.html", staff:"staff-portal.html", admin:"admin.html" }
};
