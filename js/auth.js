/**
 * Demo Authentication (localStorage)
 * Production must enforce auth server-side via Supabase Auth + RLS.
 */

const Auth = {
  SESSION_KEY: "cun_demo_session",

  login(email, password) {
    const users = window.CUN_DATA?.demoUsers || {};
    const user = users[email.toLowerCase()];
    if (!user || user.password !== password) {
      return { success: false, message: "Invalid email or password. Use demo credentials." };
    }
    const session = {
      email: email.toLowerCase(),
      role: user.role,
      name: user.name,
      id: user.id,
      programme: user.programme || null,
      level: user.level || null,
      department: user.department || null,
      loggedInAt: new Date().toISOString()
    };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    return { success: true, session };
  },

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    window.location.href = "login.html";
  },

  getSession() {
    try {
      const raw = localStorage.getItem(this.SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isLoggedIn() {
    return !!this.getSession();
  },

  requireRole(roles) {
    const session = this.getSession();
    if (!session) {
      window.location.href = "login.html";
      return null;
    }
    const allowed = Array.isArray(roles) ? roles : [roles];
    if (!allowed.includes(session.role)) {
      window.location.href = "login.html";
      return null;
    }
    return session;
  },

  requireAuth() {
    const session = this.getSession();
    if (!session) {
      window.location.href = "login.html";
      return null;
    }
    return session;
  }
};

window.Auth = Auth;
