/**
 * CUN Staff Portal — live Supabase data layer.
 */
const StaffPortal = {
  context: null,
  db: null,
  students: [],
  courses: [],
  applications: [],
  grades: [],
  fees: [],

  async init() {
    this.context = await Auth.requireRole(["staff", "admin"]);
    if (!this.context) return;

    this.db = window.SupabaseClient;
    if (!this.db) throw new Error("Supabase is not configured.");

    document.getElementById("staff-name")?.replaceChildren(
      document.createTextNode(this.context.profile?.full_name || this.context.user.email || "Staff")
    );
    document.getElementById("staff-dept")?.replaceChildren(
      document.createTextNode(this.context.profile?.staff_id || "Staff")
    );

    await this.loadAll();
    this.bind();
  },

  async loadAll() {
    await Promise.allSettled([
      this.loadCourses(),
      this.loadStudents(),
      this.loadApplications(),
      this.loadGrades(),
      this.loadFees()
    ]);
  },

  async loadCourses() {
    const { data, error } = await this.db
      .from("courses")
      .select("code,title,description,is_active")
      .eq("is_active", true)
      .limit(100);

    const t = document.getElementById("staff-courses");
    if (error) {
      this.courses = [];
      this.text("staff-course-count", 0);
      if (t) t.innerHTML = '<tr><td colspan="3" class="text-muted">Course list unavailable.</td></tr>';
      return;
    }

    this.courses = data || [];
    this.text("staff-course-count", this.courses.length);
    if (t) {
      t.innerHTML = this.courses.map(c => (
        "<tr>" +
          "<td>" + sanitize(c.code || "—") + "</td>" +
          "<td>" + sanitize(c.title || "—") + "</td>" +
          "<td>" + sanitize(c.description || "") + "</td>" +
        "</tr>"
      )).join("") || '<tr><td colspan="3" class="text-muted">No active courses.</td></tr>';
    }
  },

  async loadStudents() {
    const { data, error } = await this.db
      .from("profiles")
      .select("id,full_name,email,student_id,role")
      .eq("role", "student")
      .order("full_name")
      .limit(300);

    if (error) {
      this.students = [];
      this.text("staff-student-count", 0);
      this.renderStudents([]);
      this.fillGradeStudents();
      return;
    }

    this.students = data || [];
    this.text("staff-student-count", this.students.length);
    this.renderStudents(this.students);
    this.fillGradeStudents();
  },

  fillGradeStudents() {
    const sel = document.getElementById("grade-student");
    if (!sel) return;
    sel.innerHTML = '<option value="">Select student…</option>' + this.students.map(s =>
      "<option value=\"" + sanitize(s.id) + "\">" +
        sanitize((s.full_name || s.email || s.id) + (s.student_id ? " (" + s.student_id + ")" : "")) +
      "</option>"
    ).join("");
  },

  renderStudents(rows) {
    const t = document.getElementById("staff-students");
    if (!t) return;
    t.innerHTML = (rows || []).map(s => (
      "<tr>" +
        "<td>" + sanitize(s.full_name || "—") + "</td>" +
        "<td>" + sanitize(s.email || "—") + "</td>" +
        "<td>" + sanitize(s.student_id || "—") + "</td>" +
      "</tr>"
    )).join("") || '<tr><td colspan="3" class="text-muted">No students found.</td></tr>';
  },

  studentLabel(id) {
    const s = this.students.find(x => x.id === id);
    if (!s) return id ? String(id).slice(0, 8) + "…" : "—";
    return (s.full_name || s.email || s.student_id || s.id) + (s.student_id ? " (" + s.student_id + ")" : "");
  },

  async loadApplications() {
    const { data, error } = await this.db
      .from("applications")
      .select("id,application_number,first_name,last_name,programme_name,status,submitted_at")
      .in("status", ["received", "under_review"])
      .order("submitted_at", { ascending: false })
      .limit(100);

    const t = document.getElementById("staff-apps");
    if (error) {
      this.applications = [];
      this.text("staff-pending-apps", 0);
      if (t) t.innerHTML = '<tr><td colspan="5" class="text-muted">Applications unavailable.</td></tr>';
      return;
    }

    this.applications = data || [];
    this.text("staff-pending-apps", this.applications.length);
    if (t) {
      t.innerHTML = this.applications.map(a => (
        "<tr>" +
          "<td>" + sanitize(a.application_number || a.id) + "</td>" +
          "<td>" + sanitize(((a.first_name || "") + " " + (a.last_name || "")).trim() || "—") + "</td>" +
          "<td>" + sanitize(a.programme_name || "—") + "</td>" +
          "<td>" + sanitize(a.status || "—") + "</td>" +
          "<td>" + formatDate(a.submitted_at) + "</td>" +
        "</tr>"
      )).join("") || '<tr><td colspan="5" class="text-muted">No pending applications.</td></tr>';
    }
  },

  async loadGrades() {
    const { data, error } = await this.db
      .from("grades")
      .select("id,student_id,course_code,course_title,score,grade_letter,grade_point,session,created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    const t = document.getElementById("staff-grades");
    if (error) {
      this.grades = [];
      if (t) t.innerHTML = '<tr><td colspan="5" class="text-muted">Grades table unavailable.</td></tr>';
      return;
    }

    this.grades = data || [];
    if (t) {
      t.innerHTML = this.grades.map(g => (
        "<tr>" +
          "<td>" + sanitize(this.studentLabel(g.student_id)) + "</td>" +
          "<td>" + sanitize((g.course_code || "") + (g.course_title ? " — " + g.course_title : "")) + "</td>" +
          "<td>" + sanitize(g.score ?? "—") + "</td>" +
          "<td>" + sanitize(g.grade_letter || g.grade_point || "—") + "</td>" +
          "<td>" + sanitize(g.session || "—") + "</td>" +
        "</tr>"
      )).join("") || '<tr><td colspan="5" class="text-muted">No grades entered yet.</td></tr>';
    }
  },

  async loadFees() {
    const { data, error } = await this.db
      .from("fee_records")
      .select("id,student_id,description,amount,status,due_date")
      .order("due_date", { ascending: false })
      .limit(150);

    const t = document.getElementById("staff-fees");
    if (error) {
      this.fees = [];
      if (t) t.innerHTML = '<tr><td colspan="5" class="text-muted">Fees unavailable for this account.</td></tr>';
      return;
    }

    this.fees = data || [];
    if (t) {
      t.innerHTML = this.fees.map(f => (
        "<tr>" +
          "<td>" + sanitize(this.studentLabel(f.student_id)) + "</td>" +
          "<td>" + sanitize(f.description || "—") + "</td>" +
          "<td>NGN " + Number(f.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 }) + "</td>" +
          "<td>" + sanitize(f.status || "—") + "</td>" +
          "<td>" + (f.due_date ? formatDate(f.due_date) : "—") + "</td>" +
        "</tr>"
      )).join("") || '<tr><td colspan="5" class="text-muted">No fee records.</td></tr>';
    }
  },

  bind() {
    document.getElementById("student-search")?.addEventListener("input", e => {
      const q = e.target.value.toLowerCase();
      this.renderStudents(this.students.filter(s =>
        ((s.full_name || "") + " " + (s.email || "") + " " + (s.student_id || "")).toLowerCase().includes(q)
      ));
    });

    document.getElementById("grade-form")?.addEventListener("submit", async e => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const payload = {
        student_id: String(fd.get("student_id") || "").trim(),
        course_code: String(fd.get("course_code") || "").trim(),
        course_title: String(fd.get("course_title") || "").trim() || null,
        score: Number(fd.get("score")),
        grade_letter: String(fd.get("grade_letter") || "").trim() || null,
        grade_point: fd.get("grade_point") === "" ? null : Number(fd.get("grade_point")),
        session: String(fd.get("session") || "").trim() || null
      };

      if (!payload.student_id || !payload.course_code || !Number.isFinite(payload.score)) {
        Toast.error("Please complete the required result fields.");
        return;
      }

      const { error } = await this.db.from("grades").insert(payload);
      if (error) {
        Toast.error(error.message || "Could not save result. Check grades table/policies.");
        return;
      }

      e.currentTarget.reset();
      Toast.success("Result saved.");
      await this.loadGrades();
    });
  },

  text(id, value) {
    document.getElementById(id)?.replaceChildren(document.createTextNode(String(value ?? "")));
  }
};

window.StaffPortal = StaffPortal;

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.portal === "staff") {
    StaffPortal.init().catch(e => {
      console.error(e);
      Toast?.error(e.message || "Unable to load staff portal.");
    });
  }
});
