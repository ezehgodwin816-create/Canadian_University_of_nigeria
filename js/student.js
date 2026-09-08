/**
 * CUN Student Portal — live Supabase data layer.
 * Reads only records permitted by RLS; no privileged client access.
 */
const StudentPortal = {
  context: null,
  db: null,
  state: { applications: [], enrolments: [], grades: [], invoices: [], notifications: [], documents: [] },

  async init() {
    this.context = await Auth.requireRole("student");
    if (!this.context) return;
    this.db = window.SupabaseClient;
    if (!this.db) throw new Error("Supabase is not configured.");
    this.renderProfile();
    await Promise.all([this.loadApplications(), this.loadAcademics(), this.loadFinance(), this.loadNotifications(), this.loadDocuments()]);
    this.renderAll();
    this.bindActions();
  },

  renderProfile() {
    const p = this.context.profile || {};
    this.text("student-name", p.full_name || this.context.user.email || "Student");
    this.text("student-id", p.student_id || "Not yet assigned");
    this.text("student-level", p.level || "—");
    this.text("student-programme", "—");
  },

  async loadApplications() {
    const { data, error } = await this.db.from("applications")
      .select("id,application_number,programme_name,status,entry_type,study_mode,submitted_at,updated_at")
      .eq("user_id", this.context.user.id)
      .order("submitted_at", { ascending: false });
    if (error) throw error;
    this.state.applications = data || [];
    const latest = this.state.applications[0];
    this.text("student-programme", latest?.programme_name || "—");
  },

  async loadAcademics() {
    const [enrol, grades] = await Promise.all([
      this.db.from("enrolments").select("*").eq("student_id", this.context.user.id),
      this.db.from("grades").select("*").eq("student_id", this.context.user.id)
    ]);
    if (enrol.error) throw enrol.error;
    if (grades.error) throw grades.error;
    this.state.enrolments = enrol.data || [];
    this.state.grades = grades.data || [];
  },

  async loadFinance() {
    // Current CUN deployments may expose the ownership column as student_id or profile_id.
    // RLS already limits what the browser can see, so we read permitted rows and normalize here.
    const { data, error } = await this.db.from("invoices").select("*").order("created_at", { ascending: false }).limit(25);
    if (error) throw error;
    this.state.invoices = (data || []).filter(x => !x.student_id && !x.profile_id || x.student_id === this.context.user.id || x.profile_id === this.context.user.id);
  },

  async loadNotifications() {
    const { data, error } = await this.db.from("notifications")
      .select("id,title,message,created_at,is_read")
      .eq("user_id", this.context.user.id)
      .order("created_at", { ascending: false }).limit(20);
    if (error) throw error;
    this.state.notifications = data || [];
  },

  async loadDocuments() {
    const appIds = this.state.applications.map(a => a.id);
    if (!appIds.length) return;
    const { data, error } = await this.db.from("application_documents")
      .select("id,application_id,doc_type,file_path,uploaded_at")
      .in("application_id", appIds)
      .order("uploaded_at", { ascending: false });
    if (error) throw error;
    this.state.documents = data || [];
  },

  renderAll() {
    this.text("stat-courses", String(this.state.enrolments.length));
    this.text("stat-invoices", String(this.state.invoices.length));
    const points = this.state.grades.map(g => Number(g.grade_point)).filter(Number.isFinite);
    this.text("student-cgpa", points.length ? (points.reduce((a,b)=>a+b,0) / points.length).toFixed(2) : "—");

    const notifications = document.getElementById("notif-list");
    if (notifications) notifications.innerHTML = this.state.notifications.length
      ? this.state.notifications.map(n => `<article class="card mb-2" style="padding:1rem"><div style="display:flex;justify-content:space-between;gap:1rem"><strong>${sanitize(n.title || "Notification")}</strong>${n.is_read ? "" : '<span class="badge badge-info">New</span>'}</div><p>${sanitize(n.message || "")}</p><div class="text-muted" style="font-size:.85rem">${formatDate(n.created_at)}</div>${n.is_read ? "" : `<button class="btn btn-ghost btn-sm mt-2" data-read-notification="${sanitize(n.id)}">Mark as read</button>`}</article>`).join("")
      : '<div class="empty-state"><p>No notifications yet.</p></div>';

    const courses = document.getElementById("courses-list");
    if (courses) courses.innerHTML = this.state.enrolments.length
      ? this.state.enrolments.map(e => `<tr><td>${sanitize(e.course_code || e.code || "—")}</td><td>${sanitize(e.course_title || e.title || "Course offering")}</td><td>${sanitize(e.status || "registered")}</td><td>${formatDate(e.created_at)}</td></tr>`).join("")
      : '<tr><td colspan="4" class="text-muted">No course registrations are available yet.</td></tr>';

    const invoices = document.getElementById("invoices-list");
    if (invoices) invoices.innerHTML = this.state.invoices.length
      ? this.state.invoices.map(i => `<tr><td>${sanitize(i.invoice_number || i.id || "—")}</td><td>${sanitize(i.currency || "NGN")} ${Number(i.total ?? i.total_amount ?? 0).toLocaleString("en-NG",{minimumFractionDigits:2})}</td><td>${sanitize(i.status || "open")}</td><td>${i.due_date ? formatDate(i.due_date) : "—"}</td></tr>`).join("")
      : '<tr><td colspan="4" class="text-muted">No invoices are available yet.</td></tr>';

    const docs = document.getElementById("documents-list");
    if (docs) docs.innerHTML = this.state.documents.length
      ? this.state.documents.map(d => `<tr><td>${sanitize(d.doc_type)}</td><td>${formatDate(d.uploaded_at)}</td><td><button class="btn btn-ghost btn-sm" data-doc-path="${sanitize(d.file_path)}">Open securely</button></td></tr>`).join("")
      : '<tr><td colspan="3" class="text-muted">No application documents are available yet.</td></tr>';

    const apps = document.getElementById("student-applications");
    if (apps) apps.innerHTML = this.state.applications.length
      ? this.state.applications.map(a => `<tr><td>${sanitize(a.application_number)}</td><td>${sanitize(a.programme_name || "—")}</td><td><span class="badge badge-info">${sanitize(a.status)}</span></td><td>${formatDate(a.submitted_at)}</td></tr>`).join("")
      : '<tr><td colspan="4" class="text-muted">No applications found.</td></tr>';
  },

  bindActions() {
    document.addEventListener("click", async e => {
      const read = e.target.closest("[data-read-notification]");
      if (read) {
        const id = read.dataset.readNotification;
        const { error } = await this.db.from("notifications").update({is_read:true}).eq("id", id).eq("user_id", this.context.user.id);
        if (error) return Toast.error("Could not update notification.");
        await this.loadNotifications(); this.renderAll();
      }
      const doc = e.target.closest("[data-doc-path]");
      if (doc) {
        try {
          const { data, error } = await this.db.storage.from((window.CUN_CONFIG||{}).storageBucket || "application-documents").createSignedUrl(doc.dataset.docPath, 300);
          if (error) throw error;
          window.open(data.signedUrl, "_blank", "noopener");
        } catch { Toast.error("This document is not currently available."); }
      }
    });
  },

  text(id, value) { document.getElementById(id)?.replaceChildren(document.createTextNode(String(value ?? ""))); }
};

window.StudentPortal = StudentPortal;
document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.portal === "student") StudentPortal.init().catch(e => { console.error(e); Toast?.error(e.message || "Unable to load the student portal."); });
});
