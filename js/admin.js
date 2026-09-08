/** CUN administration console — live Supabase operations protected by RLS. */
const AdminPortal = {
  context:null, db:null, applications:[],
  async init(){
    this.context=await Auth.requireRole("admin"); if(!this.context)return;
    this.db=window.SupabaseClient; if(!this.db) throw new Error("Supabase is not configured.");
    document.getElementById("admin-name")?.replaceChildren(document.createTextNode(this.context.profile?.full_name || this.context.user.email));
    await this.refresh(); this.bind();
  },
  async refresh(){
    const [apps, programmes, profiles]=await Promise.all([
      this.db.from("applications").select("id,application_number,first_name,last_name,programme_name,status,submitted_at,updated_at,email").order("submitted_at",{ascending:false}).limit(50),
      this.db.from("programmes").select("id",{count:"exact",head:true}),
      this.db.from("profiles").select("id",{count:"exact",head:true})
    ]);
    if(apps.error) throw apps.error;
    this.applications=apps.data||[];
    this.text("stat-applications",this.applications.length);
    this.text("stat-programmes",programmes.count ?? 0);
    this.text("stat-students",profiles.count ?? 0);
    this.text("stat-pending",this.applications.filter(a=>["received","under_review","pending"].includes(a.status)).length);
    const tbody=document.getElementById("apps-tbody"); if(!tbody)return;
    tbody.innerHTML=this.applications.map(a=>`<tr data-app-row="${sanitize(a.id)}"><td>${sanitize(a.application_number)}</td><td>${sanitize(a.first_name||"")} ${sanitize(a.last_name||"")}</td><td>${sanitize(a.programme_name||"—")}</td><td><select class="status-select" data-status-id="${sanitize(a.id)}"><option value="received" ${a.status==='received'?'selected':''}>Received</option><option value="under_review" ${a.status==='under_review'?'selected':''}>Under review</option><option value="accepted" ${a.status==='accepted'?'selected':''}>Accepted</option><option value="rejected" ${a.status==='rejected'?'selected':''}>Rejected</option><option value="withdrawn" ${a.status==='withdrawn'?'selected':''}>Withdrawn</option></select></td><td>${formatDate(a.submitted_at)}</td></tr>`).join("") || '<tr><td colspan="5" class="text-center text-muted">No applications yet.</td></tr>';
  },
  bind(){
    document.addEventListener("change",async e=>{
      const sel=e.target.closest("[data-status-id]"); if(!sel)return;
      sel.disabled=true;
      const {error}=await this.db.from("applications").update({status:sel.value,updated_at:new Date().toISOString()}).eq("id",sel.dataset.statusId);
      sel.disabled=false;
      if(error){Toast.error("Status update failed: "+error.message);await this.refresh();return;}
      Toast.success("Application status updated.");
    });
  },
  text(id,v){document.getElementById(id)?.replaceChildren(document.createTextNode(String(v ?? "")));}
};
window.AdminPortal=AdminPortal;
document.addEventListener("DOMContentLoaded",()=>{if(document.body.dataset.portal==="admin")AdminPortal.init().catch(e=>{console.error(e);Toast?.error(e.message||"Unable to load administration console.");});});
