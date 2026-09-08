/** Real administration dashboard data loader. */
async function initAdminPortal() {
  const context = await Auth.requireRole("admin");
  if (!context) return;
  document.getElementById("admin-name")?.replaceChildren(document.createTextNode(context.profile?.full_name || context.user.email));
  const db=window.SupabaseClient;
  const [apps, programmes, profiles] = await Promise.all([
    db.from("applications").select("id,application_number,first_name,last_name,programme_name,status,submitted_at").order("submitted_at",{ascending:false}).limit(20),
    db.from("programmes").select("id",{count:"exact",head:true}),
    db.from("profiles").select("id",{count:"exact",head:true})
  ]);
  if(apps.error) console.error(apps.error);
  document.getElementById("stat-applications")?.replaceChildren(document.createTextNode(String(apps.data?.length || 0)));
  document.getElementById("stat-programmes")?.replaceChildren(document.createTextNode(String(programmes.count ?? 0)));
  document.getElementById("stat-students")?.replaceChildren(document.createTextNode(String(profiles.count ?? 0)));
  const pending=(apps.data||[]).filter(a=>["received","under_review","pending"].includes(a.status)).length;
  document.getElementById("stat-pending")?.replaceChildren(document.createTextNode(String(pending)));
  const tbody=document.getElementById("apps-tbody");
  if(!tbody)return;
  tbody.innerHTML=(apps.data||[]).map(a=>`<tr><td>${sanitize(a.application_number)}</td><td>${sanitize(a.first_name||"")} ${sanitize(a.last_name||"")}</td><td>${sanitize(a.programme_name||"—")}</td><td><span class="badge badge-info">${sanitize(a.status||"")}</span></td><td>${formatDate(a.submitted_at)}</td></tr>`).join("") || '<tr><td colspan="5" class="text-center text-muted">No applications yet.</td></tr>';
}
document.addEventListener("DOMContentLoaded",()=>{if(document.body.dataset.portal==="admin")initAdminPortal().catch(e=>console.error(e));});
