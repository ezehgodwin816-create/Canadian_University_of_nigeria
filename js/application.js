/** Production admissions data access. */
const Application = {
  STORAGE_KEY:"cun_application_draft",
  getCurrent(){ return Store.get(this.STORAGE_KEY,{}); },
  setCurrent(data){ Store.set(this.STORAGE_KEY,data); },
  clearCurrent(){ Store.remove(this.STORAGE_KEY); },

  async _ready(){
    try { if (window.CUNSupabaseReady) await window.CUNSupabaseReady; }
    catch(e){ return {ok:false,message:e?.message || "Admissions service could not be loaded."}; }
    if(!window.SupabaseClient?.auth) return {ok:false,message:"Admissions service is not connected. Please refresh and try again."};
    return {ok:true};
  },

  async submit(data){
    const ready = await this._ready();
    if(!ready.ok) return {success:false,message:ready.message};

    const session = await Auth.getSession();
    if(!session?.user) return {success:false,message:"Please sign in or create an applicant account before submitting an application."};

    const programmeId = data.programmeId || data.programme_id || null;
    const payload = {
      email: String(data.email || session.user.email || "").trim().toLowerCase(),
      first_name: String(data.firstName || "").trim(),
      last_name: String(data.lastName || "").trim(),
      programme_id: programmeId || null,
      programme_name: String(data.programmeName || data.programme || "").trim(),
      entry_type: data.entryType || "UTME",
      study_mode: data.studyMode || "Full-time",
      data
    };

    if(!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email))
      return {success:false,message:"Please enter a valid email address."};
    if(!payload.first_name || !payload.last_name)
      return {success:false,message:"Please enter your first and last name."};
    if(!payload.programme_name)
      return {success:false,message:"Please select a programme."};

    try {
      // Submit directly to the applications table. The database already has an
      // authenticated applicant INSERT policy and the DB trigger protects the
      // workflow fields. This avoids depending on PostgREST's RPC schema cache
      // for submit_application.
      const insertPayload = {
        user_id: session.user.id,
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name,
        programme_id: payload.programme_id,
        programme_name: payload.programme_name,
        status: "received",
        entry_type: payload.entry_type,
        study_mode: payload.study_mode,
        data: payload.data
      };

      const {data: row, error} = await window.SupabaseClient
        .from("applications")
        .insert(insertPayload)
        .select("*")
        .single();

      if(error) {
        return {success:false,message:error.message || "The application could not be submitted."};
      }

      if(!row?.application_number)
        return {success:false,message:"The application was saved but no application number was returned. Please contact Admissions."};

      this.clearCurrent();
      return {success:true,record:row};
    } catch(e) {
      return {success:false,message:e?.message || "The application could not be submitted. Please try again."};
    }
  },

  async findByNumberAndEmail(number,email){
    const ready=await this._ready(); if(!ready.ok) return null;
    const {data,error}=await window.SupabaseClient.from("applications")
      .select("id,application_number,status,submitted_at,programme_name,first_name,last_name")
      .eq("application_number",String(number||"").trim())
      .eq("email",String(email||"").trim().toLowerCase()).maybeSingle();
    return error ? null : data;
  }
};
window.Application=Application;
