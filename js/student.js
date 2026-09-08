/**
 * Student portal helpers
 */

function initStudentPortal() {
  const session = Auth.requireRole("student");
  if (!session) return;

  const nameEl = document.getElementById("student-name");
  const idEl = document.getElementById("student-id");
  const progEl = document.getElementById("student-programme");
  const levelEl = document.getElementById("student-level");

  if (nameEl) nameEl.textContent = session.name;
  if (idEl) idEl.textContent = session.id;
  if (progEl) progEl.textContent = session.programme || "—";
  if (levelEl) levelEl.textContent = session.level || "—";

  // Demo notifications
  const notif = Store.get("cun_student_notifications", [
    { title: "Welcome to the demo student portal", date: new Date().toISOString(), read: false },
    { title: "Course registration opens soon (demo)", date: new Date().toISOString(), read: false }
  ]);
  const list = document.getElementById("notif-list");
  if (list) {
    list.innerHTML = notif.map(n => `
      <div class="card mb-2" style="padding:1rem">
        <strong>${sanitize(n.title)}</strong>
        <div class="text-muted" style="font-size:0.85rem">${formatDate(n.date)}</div>
      </div>
    `).join("") || '<div class="empty-state"><p>No notifications</p></div>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.portal === "student") initStudentPortal();
});
