/**
 * Authentication boundary.
 * Supabase Auth is the production authority; local credentials are disabled.
 */
const Auth = {
  SESSION_KEY: "cun_session",

  async login(email, password) {
    if (window.SupabaseClient?.auth) {
      const {data, error} = await window.SupabaseClient.auth.signInWithPassword({
        email: email.trim().toLowerCase(), password
      });
      if (error) return {success:false, message:error.message};
      return {success:true, session:data.session, user:data.user};
    }
    return {success:false, message:"Authentication is not configured yet. Connect the Supabase project before enabling portals."};
  },

  async logout() {
    try { if (window.SupabaseClient?.auth) await window.SupabaseClient.auth.signOut(); } catch {}
    localStorage.removeItem(this.SESSION_KEY);
    window.location.href="login.html";
  },

  getSession() {
    try { return JSON.parse(localStorage.getItem(this.SESSION_KEY) || "null"); } catch { return null; }
  },

  isLoggedIn() { return !!this.getSession(); },

  requireRole(roles) {
    const session=this.getSession();
    if(!session){ window.location.href="login.html"; return null; }
    const allowed=Array.isArray(roles)?roles:[roles];
    if(session.role && !allowed.includes(session.role)){ window.location.href="login.html"; return null; }
    return session;
  },

  requireAuth() {
    const session=this.getSession();
    if(!session){ window.location.href="login.html"; return null; }
    return session;
  }
};
window.Auth=Auth;
