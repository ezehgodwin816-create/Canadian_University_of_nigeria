/**
 * Admissions workflow.
 * Public form state may be kept locally while the final submission is sent to Supabase.
 * Payment and document verification must be server-verified.
 */
const Application = {
  STORAGE_KEY:"cun_application_draft",
  getCurrent(){ return Store.get(this.STORAGE_KEY,{}); },
  setCurrent(data){ Store.set(this.STORAGE_KEY,data); },
  clearCurrent(){ Store.remove(this.STORAGE_KEY); },

  async submit(data){
    if(!window.SupabaseClient) {
      return {success:false,message:"Admissions backend is not connected. Configure Supabase before accepting applications."};
    }
    const record={...data,submittedAt:new Date().toISOString()};
    const {data:row,error}=await window.SupabaseClient
      .from("applications").insert(record).select("id,application_number,status,submitted_at").single();
    if(error) return {success:false,message:error.message};
    this.clearCurrent();
    return {success:true,record:row};
  },

  async findByNumberAndEmail(number,email){
    if(!window.SupabaseClient) return null;
    const {data,error}=await window.SupabaseClient
      .from("applications").select("id,application_number,status,submitted_at,programme_name")
      .eq("application_number",number).eq("email",email.toLowerCase()).maybeSingle();
    return error?null:data;
  }
};
window.Application=Application;
