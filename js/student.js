/** Real student portal data loader. */
async function initStudentPortal() {
  const context = await Auth.requireRole("student");
  if (!context) return;
  const db = window.SupabaseClient;
  const p = context.profile || {};
  document.getElementById("student-name")?.replaceChildren(document.createTextNode(p.full_name || context.user.email));
  document.getElementById("student-id")?.replaceChildren(document.createTextNode(p.student_id || "Not yet assigned"));

  let programme = "—";
  if (p.student_id && db) {
    const {data: apps} = await db.from("applications").select("programme_name").eq("user_id",context.user.id).order("submitted_at",{ascending:false}).limit(1);
    programme = apps?.[0]?.programme_name || programme;
  }
  document.getElementById("student-programme")?.replaceChildren(document.createTextNode(programme));
  document.getElementById("student-level")?.replaceChildren(document.createTextNode("—"));

  const [enrolments, grades, invoices, notifications] = await Promise.all([
    db.from("enrolments").select("id,course_offering_id").eq("student_id",context.user.id),
    db.from("grades").select("id,assessment_id,score,grade_point").eq("student_id",context.user.id),
    db.from("invoices").select("id,invoice_number,total_amount,status,due_date").eq("student_id",context.user.id).order("created_at",{ascending:false}).limit(10),
    db.from("notifications").select("id,title,message,created_at,is_read").eq("user_id",context.user.id).order("created_at",{ascending:false}).limit(10)
  ]);

  const gradeRows = grades.data || [];
  const points = gradeRows.map(g => Number(g.grade_point)).filter(Number.isFinite);
  const cgpa = points.length ? (points.reduce((a,b)=>a+b,0)/points.length).toFixed(2) : "—";
  document.getElementById("student-cgpa")?.replaceChildren(document.createTextNode(cgpa));

  const notif = document.getElementById("notif-list");
  if (notif) notif.innerHTML = (notifications.data || []).map(n => `<div class="card mb-2" style="padding:1rem"><strong>${sanitize(n.title||"Notification")}</strong><p>${sanitize(n.message||"")}</p><div class="text-muted" style="font-size:.85rem">${formatDate(n.created_at)}</div></div>`).join("") || '<div class="empty-state"><p>No notifications yet.</p></div>';

  const statCourses=document.getElementById("stat-courses"); if(statCourses) statCourses.textContent=(enrolments.data||[]).length;
  const statInvoices=document.getElementById("stat-invoices"); if(statInvoices) statInvoices.textContent=(invoices.data||[]).length;
}
document.addEventListener("DOMContentLoaded",()=>{ if(document.body.dataset.portal==="student") initStudentPortal().catch(e=>console.error(e)); });
