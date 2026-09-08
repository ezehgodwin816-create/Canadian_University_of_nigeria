/**
 * CUN production authentication boundary.
 * Supabase Auth is the authority; no local/demo credentials are accepted.
 */
const Auth = {
  SESSION_KEY: "cun_session",

  async getSession() {
    if (window.CUNSupabaseReady) await window.CUNSupabaseReady;
    if (!window.SupabaseClient?.auth) return null;
    const { data, error } = await window.SupabaseClient.auth.getSession();
    if (error || !data?.session) return null;
    return data.session;
  },

  async getUserContext() {
    if (window.CUNSupabaseReady) await window.CUNSupabaseReady;
    if (!window.SupabaseClient?.auth) return null;
    const { data: authData, error: authError } = await window.SupabaseClient.auth.getUser();
    if (authError || !authData?.user) return null;
    const user = authData.user;
    let profile = null;
    let roles = [];

    const profileRes = await window.SupabaseClient.from("profiles")
      .select("id,email,full_name,role,student_id,staff_id,phone,avatar_url")
      .eq("id", user.id).maybeSingle();
    if (!profileRes.error) profile = profileRes.data;

    const roleRes = await window.SupabaseClient.from("user_roles")
      .select("roles(code,name)").eq("user_id", user.id);
    if (!roleRes.error) roles = (roleRes.data || []).map(x => x.roles).filter(Boolean);

    return { user, profile, roles };
  },

  async login(email, password) {
    try {
      if (window.CUNSupabaseReady) await window.CUNSupabaseReady;
    } catch (e) {
      return {success:false,message:e.message || "Supabase could not be loaded. Please refresh and try again."};
    }
    if (!window.SupabaseClient?.auth) return {success:false,message:"Authentication is not configured. Check js/config.js."};
    const {data, error} = await window.SupabaseClient.auth.signInWithPassword({
      email: String(email || "").trim().toLowerCase(), password
    });
    if (error) return {success:false,message:error.message};
    const context = await this.getUserContext();
    const roleCodes = (context?.roles || []).map(r => r.code);
    let role = "student";
    if (roleCodes.includes("super_admin") || roleCodes.includes("admin")) role = "admin";
    else if (roleCodes.some(r => ["admissions","finance","registry","registrar","academic","staff"].includes(r))) role = "staff";
    else if (context?.profile?.role === "admin") role = "admin";
    else if (context?.profile?.role === "staff") role = "staff";
    return {success:true, session:data.session, user:data.user, context, role};
  },

  async signup(email, password, fullName) {
    if (!window.SupabaseClient?.auth) return {success:false,message:"Authentication is not configured."};
    const {data,error} = await window.SupabaseClient.auth.signUp({
      email:String(email||"").trim().toLowerCase(), password,
      options:{data:{full_name:String(fullName||"").trim()}}
    });
    if(error) return {success:false,message:error.message};
    return {success:true,data};
  },

  async logout() {
    try { if (window.SupabaseClient?.auth) await window.SupabaseClient.auth.signOut(); } catch {}
    localStorage.removeItem(this.SESSION_KEY);
    window.location.href="login.html";
  },

  async requireRole(roles) {
    const context = await this.getUserContext();
    if(!context) { window.location.href="login.html"; return null; }
    const allowed = Array.isArray(roles) ? roles : [roles];
    const roleCodes = (context.roles || []).map(r => r.code);
    const profileRole = context.profile?.role;
    const effective = roleCodes.includes("super_admin") || roleCodes.includes("admin") || profileRole === "admin" ? "admin" :
      roleCodes.some(r => ["admissions","finance","registry","registrar","academic","staff"].includes(r)) || profileRole === "staff" ? "staff" : "student";
    if(!allowed.includes(effective)) { window.location.href="login.html"; return null; }
    return {...context, role:effective};
  },

  async requireAuth() {
    const context = await this.getUserContext();
    if(!context) { window.location.href="login.html"; return null; }
    return context;
  }
};
window.Auth=Auth;
