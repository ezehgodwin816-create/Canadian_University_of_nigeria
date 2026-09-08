/** Production admissions data access. */
const Application = {
  STORAGE_KEY:"cun_application_draft",
  getCurrent(){ return Store.get(this.STORAGE_KEY,{}); },
  setCurrent(data){ Store.set(this.STORAGE_KEY,data); },
  clearCurrent(){ Store.remove(this.STORAGE_KEY); },

  async submit(data){
    if(!window.SupabaseClient) return {success:false,message:"Admissions backend is not connected."};
    const session = await Auth.getSession();
    if(!session?.user) return {success:false,message:"Please sign in or create an applicant account before submitting an application."};

    const payload = {
      email: String(data.email || session.user.email || "").trim().toLowerCase(),
      first_name: data.firstName || "",
      last_name: data.lastName || "",
      programme_id: data.programmeId || null,
      programme_name: data.programme || "",
      entry_type: data.entryType || "UTME",
      study_mode: data.studyMode || "Full-time",
      data
    };

    // The database RPC generates the authoritative application number and records
    // the authenticated owner. This prevents client-side number collisions.
    const {data: row, error} = await window.SupabaseClient.rpc("submit_application", {p_payload: payload});
    if(error) return {success:false,message:error.message};
    const record = Array.isArray(row) ? row[0] : row;
    if(!record) return {success:false,message:"Application was not returned by the admissions service."};
    this.clearCurrent();
    return {success:true,record};
  },

  async findByNumberAndEmail(number,email){
    if(!window.SupabaseClient) return null;
    const {data,error}=await window.SupabaseClient.from("applications")
      .select("id,application_number,status,submitted_at,programme_name,first_name,last_name")
      .eq("application_number",String(number||"").trim())
      .eq("email",String(email||"").trim().toLowerCase()).maybeSingle();
    return error ? null : data;
  }
};
window.Application=Application;
