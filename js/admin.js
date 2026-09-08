/**
 * Administration dashboard helpers
 */

function initAdminPortal() {
  const session = Auth.requireRole("admin");
  if (!session) return;

  const nameEl = document.getElementById("admin-name");
  if (nameEl) nameEl.textContent = session.name;

  // Demo stats from localStorage applications
  const apps = Application.getAll();
  const appsEl = document.getElementById("stat-applications");
  if (appsEl) appsEl.textContent = apps.length;

  // Recent applications table
  const tbody = document.getElementById("apps-tbody");
  if (tbody) {
    if (apps.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No applications yet</td></tr>`;
    } else {
      tbody.innerHTML = apps.slice().reverse().slice(0, 10).map(a => `
        <tr>
          <td>${sanitize(a.applicationNumber)}</td>
          <td>${sanitize(a.firstName || "")} ${sanitize(a.lastName || "")}</td>
          <td>${sanitize(a.programme || "—")}</td>
          <td><span class="badge badge-info">${sanitize(a.status)}</span></td>
          <td>${formatDate(a.submittedAt)}</td>
        </tr>
      `).join("");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.portal === "admin") initAdminPortal();
});
