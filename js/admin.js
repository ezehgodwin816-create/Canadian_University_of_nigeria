/**
 * CUN Administration console — live Supabase data layer.
 */
const AdminPortal = {
  context: null,
  db: null,
  applications: [],
  users: [],
  fees: [],
  payments: [],
  studentOptions: [],

  async init() {
    this.context = await Auth.requireRole("admin");
    if (!this.context) return;

    this.db = window.SupabaseClient;
    if (!this.db) throw new Error("Supabase is not configured.");

    document.getElementById("admin-name")?.replaceChildren(
      document.createTextNode(this.context.profile?.full_name || this.context.user.email || "Admin")
    );

    await this.refreshAll();
    this.bind();
  },

  async refreshAll() {
    await Promise.allSettled([
      this.refreshApplications(),
      this.refreshUsers(),
      this.refreshFees(),
      this.refreshPayments(),
      this.refreshProgrammes(),
      this.refreshNews(),
      this.refreshEvents(),
      this.refreshAudit()
    ]);
  },

  async refreshApplications() {
    const { data, error } = await this.db
      .from("applications")
      .select("id,application_number,first_name,last_name,programme_name,status,submitted_at")
      .order("submitted_at", { ascending: false })
      .limit(200);

    if (error) throw error;
    this.applications = data || [];
    this.text("stat-applications", this.applications.length);
    const pending = this.applications.filter(a => ["received", "under_review"].includes(String(a.status || "").toLowerCase())).length;
    this.text("stat-pending-label", pending + " awaiting review");
    this.renderApplications(this.applications);
  },

  renderApplications(rows) {
    const t = document.getElementById("apps-tbody");
    if (!t) return;
    t.innerHTML = (rows || []).map(a => {
      const status = String(a.status || "received");
      return (
        "<tr>" +
          "<td>" + sanitize(a.application_number || a.id) + "</td>" +
          "<td>" + sanitize(((a.first_name || "") + " " + (a.last_name || "")).trim() || "—") + "</td>" +
          "<td>" + sanitize(a.programme_name || "—") + "</td>" +
          "<td><select class=\"form-control\" data-app-status=\"" + sanitize(a.id) + "\">" +
            this.option("received", status) +
            this.option("under_review", status) +
            this.option("accepted", status) +
            this.option("rejected", status) +
            this.option("withdrawn", status) +
          "</select></td>" +
          "<td>" + formatDate(a.submitted_at) + "</td>" +
        "</tr>"
      );
    }).join("") || '<tr><td colspan="5">No applications.</td></tr>';
  },

  option(value, current) {
    const selected = String(current).toLowerCase() === value ? " selected" : "";
    const label = value.replace(/_/g, " ");
    return "<option value=\"" + value + "\"" + selected + ">" + label + "</option>";
  },

  async refreshUsers() {
    const { data, error, count } = await this.db
      .from("profiles")
      .select("id,email,full_name,role,student_id,staff_id,created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) throw error;
    this.users = data || [];
    this.text("stat-users", count ?? this.users.length);
    this.studentOptions = this.users.filter(u => String(u.role || "").toLowerCase() === "student");
    this.fillStudentSelect();
    this.renderUsers(this.users);
  },

  fillStudentSelect() {
    const sel = document.getElementById("fee-student");
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">Select student…</option>' + this.studentOptions.map(s =>
      "<option value=\"" + sanitize(s.id) + "\">" +
        sanitize((s.full_name || s.email || s.id) + (s.student_id ? " (" + s.student_id + ")" : "")) +
      "</option>"
    ).join("");
    if (current) sel.value = current;
  },

  renderUsers(rows) {
    const t = document.getElementById("users-tbody");
    if (!t) return;
    t.innerHTML = (rows || []).map(u => {
      const role = String(u.role || "applicant");
      return (
        "<tr>" +
          "<td>" + sanitize(u.full_name || "—") + "</td>" +
          "<td>" + sanitize(u.email || "—") + "</td>" +
          "<td><select class=\"form-control\" data-role-id=\"" + sanitize(u.id) + "\">" +
            this.option("applicant", role) +
            this.option("student", role) +
            this.option("staff", role) +
            this.option("admin", role) +
          "</select></td>" +
          "<td>" + sanitize(u.student_id || u.staff_id || "—") + "</td>" +
        "</tr>"
      );
    }).join("") || '<tr><td colspan="4">No users.</td></tr>';
  },

  async refreshFees() {
    const { data, error } = await this.db
      .from("fee_records")
      .select("id,student_id,session,amount,description,due_date,status")
      .order("due_date", { ascending: false })
      .limit(300);

    if (error) {
      console.warn("fee_records load failed", error);
      this.fees = [];
      this.text("stat-fees", 0);
      this.renderFees([]);
      return;
    }

    this.fees = data || [];
    const outstanding = this.fees.filter(f => String(f.status || "").toLowerCase() === "outstanding").length;
    this.text("stat-fees", outstanding);
    this.renderFees(this.fees);
  },

  studentLabel(studentId) {
    const u = this.users.find(x => x.id === studentId);
    if (!u) return studentId ? String(studentId).slice(0, 8) + "…" : "—";
    return (u.full_name || u.email || u.student_id || u.id) + (u.student_id ? " (" + u.student_id + ")" : "");
  },

  renderFees(rows) {
    const t = document.getElementById("fees-tbody");
    if (!t) return;
    t.innerHTML = (rows || []).map(f => {
      const status = String(f.status || "outstanding").toLowerCase();
      return (
        "<tr>" +
          "<td>" + sanitize(this.studentLabel(f.student_id)) + "</td>" +
          "<td>" + sanitize(f.description || "—") + "</td>" +
          "<td>" + sanitize(f.session || "—") + "</td>" +
          "<td>NGN " + Number(f.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 }) + "</td>" +
          "<td><select class=\"form-control\" data-fee-status=\"" + sanitize(f.id) + "\">" +
            this.option("outstanding", status) +
            this.option("partial", status) +
            this.option("paid", status) +
            this.option("waived", status) +
          "</select></td>" +
          "<td>" + (f.due_date ? formatDate(f.due_date) : "—") + "</td>" +
          "<td><button type=\"button\" class=\"btn btn-ghost btn-sm\" data-delete-fee=\"" + sanitize(f.id) + "\">Delete</button></td>" +
        "</tr>"
      );
    }).join("") || '<tr><td colspan="7">No fee records yet.</td></tr>';
  },

  async refreshPayments() {
    const { data, error } = await this.db
      .from("payments")
      .select("id,student_id,amount,reference,status,provider,created_at,paid_at,fee_record_id")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.warn("payments load failed", error);
      this.payments = [];
      this.text("stat-payments", 0);
      this.renderPayments([]);
      return;
    }

    this.payments = data || [];
    const success = this.payments.filter(p => ["success", "successful", "paid"].includes(String(p.status || "").toLowerCase())).length;
    this.text("stat-payments", success);
    this.renderPayments(this.payments);
  },

  renderPayments(rows) {
    const t = document.getElementById("payments-tbody");
    if (!t) return;
    t.innerHTML = (rows || []).map(p => (
      "<tr>" +
        "<td>" + sanitize(p.reference || p.id) + "</td>" +
        "<td>" + sanitize(this.studentLabel(p.student_id)) + "</td>" +
        "<td>NGN " + Number(p.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 }) + "</td>" +
        "<td><span class=\"status-pill\">" + sanitize(p.status || "—") + "</span></td>" +
        "<td>" + sanitize(p.provider || "—") + "</td>" +
        "<td>" + formatDate(p.paid_at || p.created_at) + "</td>" +
      "</tr>"
    )).join("") || '<tr><td colspan="6">No payments yet.</td></tr>';
  },

  async refreshProgrammes() {
    const { data, error, count } = await this.db
      .from("programmes")
      .select("id,name,is_active,faculties(name)", { count: "exact" })
      .order("name")
      .limit(200);

    const t = document.getElementById("programme-tbody");
    if (error) {
      if (t) {
        t.innerHTML = '<tr><td colspan="3">Programme table unavailable or empty.</td></tr>';
      }
      return;
    }

    if (t) {
      t.innerHTML = (data || []).map(p => (
        "<tr>" +
          "<td>" + sanitize(p.name) + "</td>" +
          "<td>" + sanitize(p.faculties?.name || "—") + "</td>" +
          "<td>" + (p.is_active ? "Active" : "Inactive") + "</td>" +
        "</tr>"
      )).join("") || '<tr><td colspan="3">No programmes in database.</td></tr>';
    }
  },

  async refreshNews() {
    const { data, error } = await this.db
      .from("news_posts")
      .select("id,title,category,published_at,is_published")
      .order("published_at", { ascending: false })
      .limit(100);

    const t = document.getElementById("news-tbody");
    if (!t) return;
    if (error) {
      t.innerHTML = '<tr><td colspan="4">News table unavailable.</td></tr>';
      return;
    }
    t.innerHTML = (data || []).map(n => (
      "<tr>" +
        "<td>" + sanitize(n.title) + "</td>" +
        "<td>" + sanitize(n.category || "") + "</td>" +
        "<td>" + (n.is_published ? "Published" : "Draft") + "</td>" +
        "<td><button class=\"btn btn-sm btn-ghost\" data-delete-news=\"" + sanitize(n.id) + "\">Delete</button></td>" +
      "</tr>"
    )).join("") || '<tr><td colspan="4">No managed news posts.</td></tr>';
  },

  async refreshEvents() {
    const { data, error } = await this.db
      .from("events")
      .select("id,title,event_date,location")
      .order("event_date", { ascending: false })
      .limit(100);

    const t = document.getElementById("events-tbody");
    if (!t) return;
    if (error) {
      t.innerHTML = '<tr><td colspan="4">Events table unavailable.</td></tr>';
      return;
    }
    t.innerHTML = (data || []).map(n => (
      "<tr>" +
        "<td>" + sanitize(n.title) + "</td>" +
        "<td>" + formatDate(n.event_date) + "</td>" +
        "<td>" + sanitize(n.location || "") + "</td>" +
        "<td><button class=\"btn btn-sm btn-ghost\" data-delete-event=\"" + sanitize(n.id) + "\">Delete</button></td>" +
      "</tr>"
    )).join("") || '<tr><td colspan="4">No managed events.</td></tr>';
  },

  async refreshAudit() {
    const { data, error } = await this.db
      .from("audit_log")
      .select("action,entity,created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    const t = document.getElementById("audit-tbody");
    if (!t) return;
    if (error) {
      t.innerHTML = '<tr><td colspan="3">Audit log unavailable.</td></tr>';
      return;
    }
    t.innerHTML = (data || []).map(a => (
      "<tr>" +
        "<td>" + sanitize(a.action) + "</td>" +
        "<td>" + sanitize(a.entity || "") + "</td>" +
        "<td>" + formatDate(a.created_at) + "</td>" +
      "</tr>"
    )).join("") || '<tr><td colspan="3">No audit entries.</td></tr>';
  },

  bind() {
    document.getElementById("application-search")?.addEventListener("input", e => {
      const q = e.target.value.toLowerCase();
      this.renderApplications(this.applications.filter(a =>
        (a.application_number + " " + (a.first_name || "") + " " + (a.last_name || "") + " " + (a.programme_name || "")).toLowerCase().includes(q)
      ));
    });

    document.getElementById("user-search")?.addEventListener("input", e => {
      const q = e.target.value.toLowerCase();
      this.renderUsers(this.users.filter(u =>
        ((u.full_name || "") + " " + (u.email || "") + " " + (u.student_id || "") + " " + (u.staff_id || "")).toLowerCase().includes(q)
      ));
    });

    document.getElementById("fee-search")?.addEventListener("input", e => {
      const q = e.target.value.toLowerCase();
      this.renderFees(this.fees.filter(f =>
        (this.studentLabel(f.student_id) + " " + (f.description || "") + " " + (f.session || "") + " " + (f.status || "")).toLowerCase().includes(q)
      ));
    });

    document.addEventListener("change", async e => {
      const app = e.target.closest("[data-app-status]");
      if (app) {
        const { error } = await this.db.from("applications")
          .update({ status: app.value, updated_at: new Date().toISOString() })
          .eq("id", app.dataset.appStatus);
        if (error) {
          Toast.error(error.message);
          await this.refreshApplications();
        } else {
          Toast.success("Application status updated.");
        }
        return;
      }

      const role = e.target.closest("[data-role-id]");
      if (role) {
        const { error } = await this.db.from("profiles")
          .update({ role: role.value, updated_at: new Date().toISOString() })
          .eq("id", role.dataset.roleId);
        if (error) {
          Toast.error(error.message);
          await this.refreshUsers();
        } else {
          Toast.success("Role updated.");
          await this.refreshUsers();
        }
        return;
      }

      const feeStatus = e.target.closest("[data-fee-status]");
      if (feeStatus) {
        const { error } = await this.db.from("fee_records")
          .update({ status: feeStatus.value })
          .eq("id", feeStatus.dataset.feeStatus);
        if (error) {
          Toast.error(error.message);
          await this.refreshFees();
        } else {
          Toast.success("Fee status updated.");
          await this.refreshFees();
        }
      }
    });

    document.getElementById("fee-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const payload = {
        student_id: String(fd.get("student_id") || "").trim(),
        session: String(fd.get("session") || "").trim(),
        amount: Number(fd.get("amount")),
        description: String(fd.get("description") || "").trim(),
        due_date: fd.get("due_date") || null,
        status: "outstanding"
      };

      if (!payload.student_id || !payload.session || !payload.description || !(payload.amount > 0)) {
        Toast.error("Please complete all fee fields.");
        return;
      }

      const { error } = await this.db.from("fee_records").insert(payload);
      if (error) {
        Toast.error(error.message);
        return;
      }
      e.currentTarget.reset();
      Toast.success("Fee created for student.");
      await this.refreshFees();
    });

    document.getElementById("bulk-fee-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const session = String(fd.get("session") || "").trim();
      const amount = Number(fd.get("amount"));
      const description = String(fd.get("description") || "").trim();
      const due_date = fd.get("due_date") || null;

      if (!session || !description || !(amount > 0)) {
        Toast.error("Please complete bulk fee fields.");
        return;
      }

      if (!this.studentOptions.length) {
        Toast.error("No students found. Set user roles to student first.");
        return;
      }

      if (!confirm("Create this fee for " + this.studentOptions.length + " student(s)?")) return;

      const rows = this.studentOptions.map(s => ({
        student_id: s.id,
        session,
        amount,
        description,
        due_date,
        status: "outstanding"
      }));

      const { error } = await this.db.from("fee_records").insert(rows);
      if (error) {
        Toast.error(error.message);
        return;
      }
      Toast.success("Created " + rows.length + " fee records.");
      await this.refreshFees();
    });

    document.getElementById("news-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const publishedAt = fd.get("published_at");
      const { error } = await this.db.from("news_posts").insert({
        title: fd.get("title"),
        category: fd.get("category"),
        excerpt: fd.get("excerpt"),
        image_url: fd.get("image_url") || null,
        published_at: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
        is_published: true,
        author_id: this.context.user.id
      });
      if (error) {
        Toast.error(error.message);
        return;
      }
      e.currentTarget.reset();
      Toast.success("News published.");
      await this.refreshNews();
    });

    document.getElementById("event-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const { error } = await this.db.from("events").insert({
        title: fd.get("title"),
        category: fd.get("category"),
        event_date: fd.get("event_date"),
        location: fd.get("location"),
        description: fd.get("description"),
        is_published: true,
        author_id: this.context.user.id
      });
      if (error) {
        Toast.error(error.message);
        return;
      }
      e.currentTarget.reset();
      Toast.success("Event published.");
      await this.refreshEvents();
    });

    document.addEventListener("click", async e => {
      const delFee = e.target.closest("[data-delete-fee]");
      if (delFee) {
        if (!confirm("Delete this fee record?")) return;
        const { error } = await this.db.from("fee_records").delete().eq("id", delFee.dataset.deleteFee);
        if (error) Toast.error(error.message);
        else {
          Toast.success("Fee deleted.");
          await this.refreshFees();
        }
        return;
      }

      const delNews = e.target.closest("[data-delete-news]");
      if (delNews) {
        if (!confirm("Delete this news item?")) return;
        const { error } = await this.db.from("news_posts").delete().eq("id", delNews.dataset.deleteNews);
        if (error) Toast.error(error.message);
        else {
          Toast.success("News deleted.");
          await this.refreshNews();
        }
        return;
      }

      const delEvent = e.target.closest("[data-delete-event]");
      if (delEvent) {
        if (!confirm("Delete this event?")) return;
        const { error } = await this.db.from("events").delete().eq("id", delEvent.dataset.deleteEvent);
        if (error) Toast.error(error.message);
        else {
          Toast.success("Event deleted.");
          await this.refreshEvents();
        }
      }
    });
  },

  text(id, value) {
    document.getElementById(id)?.replaceChildren(document.createTextNode(String(value ?? "")));
  }
};

window.AdminPortal = AdminPortal;

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.portal === "admin") {
    AdminPortal.init().catch(e => {
      console.error(e);
      Toast?.error(e.message || "Unable to load administration console.");
    });
  }
});
