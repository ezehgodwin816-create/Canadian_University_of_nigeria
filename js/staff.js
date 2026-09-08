/**
 * Staff portal helpers
 */

function initStaffPortal() {
  const session = Auth.requireRole("staff");
  if (!session) return;

  const nameEl = document.getElementById("staff-name");
  const deptEl = document.getElementById("staff-dept");
  if (nameEl) nameEl.textContent = session.name;
  if (deptEl) deptEl.textContent = session.department || "—";
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.portal === "staff") initStaffPortal();
});
