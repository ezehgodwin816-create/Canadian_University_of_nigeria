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

    // Load each area independently. One unavailable table must not prevent
    // Finance/Invoices or the rest of the portal from rendering.
    const loaders = [
      ["applications", () => this.loadApplications()],
      ["academics", () => this.loadAcademics()],
      ["finance", () => this.loadFinance()],
      ["notifications", () => this.loadNotifications()],
      ["documents", () => this.loadDocuments()]
    ];

    const results = await Promise.allSettled(loaders.map(([, fn]) => fn()));
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`CUN Student Portal ${loaders[index][0]} error:`, result.reason);
      }
    });

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
    // Primary production table: fee_records. Legacy deployments may still expose invoices.
    let result = await this.db.from("fee_records").select("*").order("due_date", { ascending: true }).limit(25);
    if (result.error) {
      console.warn("fee_records unavailable; trying invoices compatibility table", result.error);
      result = await this.db.from("invoices").select("*").limit(25);
    }
    if (result.error) throw result.error;

    const uid = this.context.user.id;
    this.state.invoices = (result.data || []).filter(x =>
      (!x.student_id && !x.profile_id) ||
      x.student_id === uid ||
      x.profile_id === uid
    ).sort((a,b) => new Date(a.due_date || a.created_at || 0) - new Date(b.due_date || b.created_at || 0));
  },

  async loadNotifications() {
    const { data, error } = await this.db.from("notifications")
      .select("id,title,message,created_at,is_read")
      .eq("user_id", this.context.user.id)
      .order("created_at", { ascending: false })
      .limit(20);

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

    const points = this.state.grades
      .map(g => Number(g.grade_point))
      .filter(Number.isFinite);

    this.text(
      "student-cgpa",
      points.length
        ? (points.reduce((a, b) => a + b, 0) / points.length).toFixed(2)
        : "—"
    );

    const notifications = document.getElementById("notif-list");
    if (notifications) {
      notifications.innerHTML = this.state.notifications.length
        ? this.state.notifications.map(n =>
            `<article class="card mb-2" style="padding:1rem">
              <div style="display:flex;justify-content:space-between;gap:1rem">
                <strong>${sanitize(n.title || "Notification")}</strong>
                ${n.is_read ? "" : '<span class="badge badge-info">New</span>'}
              </div>
              <p>${sanitize(n.message || "")}</p>
              <div class="text-muted" style="font-size:.85rem">${formatDate(n.created_at)}</div>
              ${n.is_read ? "" : `<button class="btn btn-ghost btn-sm mt-2" data-read-notification="${sanitize(n.id)}">Mark as read</button>`}
            </article>`
          ).join("")
        : '<div class="empty-state"><p>No notifications yet.</p></div>';
    }

    const courses = document.getElementById("courses-list");
    if (courses) {
      courses.innerHTML = this.state.enrolments.length
        ? this.state.enrolments.map(e =>
            `<tr>
              <td>${sanitize(e.course_code || e.code || "—")}</td>
              <td>${sanitize(e.course_title || e.title || "Course offering")}</td>
              <td>${sanitize(e.status || "registered")}</td>
              <td>${formatDate(e.created_at)}</td>
            </tr>`
          ).join("")
        : '<tr><td colspan="4" class="text-muted">No course registrations are available yet.</td></tr>';
    }

    // Finance/Invoices is rendered independently of every other portal area.
    const invoices = document.getElementById("invoices-list");
    if (invoices) {
      invoices.innerHTML = this.state.invoices.length
        ? this.state.invoices.map(i => {
            const amount = Number(i.total ?? i.total_amount ?? i.amount ?? 0);
            const status = String(i.status || "outstanding").toLowerCase();
            const paid = ["paid", "success", "successful", "completed"].includes(status);
            const canPay = amount > 0 && !paid;

            return `<tr>
              <td>${sanitize(i.invoice_number || i.id || "—")}</td>
              <td>${sanitize(i.currency || "NGN")} ${amount.toLocaleString("en-NG", {minimumFractionDigits:2})}</td>
              <td>${sanitize(i.status || "open")}</td>
              <td>${i.due_date ? formatDate(i.due_date) : "—"}</td>
              <td>
                ${canPay
                  ? `<button type="button" class="btn btn-accent btn-sm"
                      data-pay-invoice="${sanitize(i.id || "")}"
                      data-pay-amount="${amount}" data-fee-record-id="${sanitize(i.fee_record_id || i.id || "")}">Pay now</button>`
                  : paid
                    ? '<span class="text-muted">Paid</span>'
                    : '—'}
              </td>
            </tr>`;
          }).join("")
        : '<tr><td colspan="5" class="text-muted">No invoices are available yet.</td></tr>';
    }

    const docs = document.getElementById("documents-list");
    if (docs) {
      docs.innerHTML = this.state.documents.length
        ? this.state.documents.map(d =>
            `<tr>
              <td>${sanitize(d.doc_type)}</td>
              <td>${formatDate(d.uploaded_at)}</td>
              <td><button class="btn btn-ghost btn-sm" data-doc-path="${sanitize(d.file_path)}">Open securely</button></td>
            </tr>`
          ).join("")
        : '<tr><td colspan="3" class="text-muted">No application documents are available yet.</td></tr>';
    }

    const apps = document.getElementById("student-applications");
    if (apps) {
      apps.innerHTML = this.state.applications.length
        ? this.state.applications.map(a =>
            `<tr>
              <td>${sanitize(a.application_number)}</td>
              <td>${sanitize(a.programme_name || "—")}</td>
              <td><span class="badge badge-info">${sanitize(a.status)}</span></td>
              <td>${formatDate(a.submitted_at)}</td>
            </tr>`
          ).join("")
        : '<tr><td colspan="4" class="text-muted">No applications found.</td></tr>';
    }
  },

  bindActions() {
    if (this._actionsBound) return;
    this._actionsBound = true;

    document.addEventListener("click", async e => {
      const read = e.target.closest("[data-read-notification]");
      if (read) {
        const id = read.dataset.readNotification;
        const { error } = await this.db
          .from("notifications")
          .update({ is_read: true })
          .eq("id", id)
          .eq("user_id", this.context.user.id);

        if (error) return Toast.error("Could not update notification.");

        await this.loadNotifications();
        this.renderAll();
        return;
      }

      const pay = e.target.closest("[data-pay-invoice]");
      if (pay) {
        await this.payInvoice(pay);
        return;
      }

      const doc = e.target.closest("[data-doc-path]");
      if (doc) {
        try {
          const { data, error } = await this.db.storage
            .from((window.CUN_CONFIG || {}).storageBucket || "application-documents")
            .createSignedUrl(doc.dataset.docPath, 300);

          if (error) throw error;
          window.open(data.signedUrl, "_blank", "noopener");
        } catch {
          Toast.error("This document is not currently available.");
        }
      }
    });
  },

  async payInvoice(button) {
    const amount = Number(button.dataset.payAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      Toast.error("This invoice does not have a valid amount.");
      return;
    }

    button.disabled = true;
    button.textContent = "Starting…";

    try {
      // Do not send the invoice UUID as fee_record_id. An invoices.id value
      // is not necessarily a fee_records.id and can cause a foreign-key error.
      const { data, error } = await this.db.functions.invoke("create-payment", {
        body: { amount }
      });

      if (error) throw error;
      if (!data?.reference) {
        throw new Error(data?.error || "Could not create payment reference.");
      }

      if (!window.CUNPayments?.open) {
        throw new Error("Payment gateway is not available.");
      }

      await window.CUNPayments.open({
        email: this.context.user.email,
        amount: data.amount,
        reference: data.reference,

        onSuccess: () => {
          Toast.success("Payment received. We are verifying the transaction now.");
          button.disabled = true;
          button.textContent = "Verification pending";

          setTimeout(() => {
            this.loadFinance()
              .then(() => this.renderAll())
              .catch(e => console.error("Finance refresh error:", e));
          }, 3000);
        },

        onCancel: () => {
          button.disabled = false;
          button.textContent = "Pay now";
          Toast.info("Payment cancelled.");
        }
      });
    } catch (e) {
      console.error("CUN Paystack payment error", e);
      button.disabled = false;
      button.textContent = "Pay now";
      Toast.error(e?.message || "Payment could not be started.");
    }
  },

  text(id, value) {
    document.getElementById(id)?.replaceChildren(
      document.createTextNode(String(value ?? ""))
    );
  }
};

window.StudentPortal = StudentPortal;

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.portal === "student") {
    StudentPortal.init().catch(e => {
      console.error(e);
      Toast?.error(e.message || "Unable to load the student portal.");
    });
  }
});
