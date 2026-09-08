/* CUN platform service layer. UI pages call this layer instead of owning data logic. */
window.CUNPlatform = {
  async session(){
    if(!window.SupabaseClient) return {user:null,error:new Error('Supabase is not configured')};
    return window.SupabaseClient.auth.getSession();
  },
  async currentUser(){
    if(!window.SupabaseClient) return null;
    const {data}=await window.SupabaseClient.auth.getUser(); return data?.user||null;
  },
  async saveApplication(payload){
    const user=await this.currentUser();
    if(!user) throw new Error('Please sign in before submitting an application.');
    const {data,error}=await window.SupabaseClient.from('applications').insert({...payload,user_id:user.id,email:user.email}).select().single();
    if(error) throw error; return data;
  },
  async submitEnquiry(payload){
    if(!window.SupabaseClient) throw new Error('Contact service is not configured.');
    const {data,error}=await window.SupabaseClient.from('enquiries').insert(payload).select().single();
    if(error) throw error; return data;
  },
  async searchContent(query){
    if(!window.SupabaseClient || !query?.trim()) return [];
    const q=query.trim();
    const {data,error}=await window.SupabaseClient.from('content_items').select('id,content_type,slug,title,excerpt,published_at').eq('status','published').or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`).limit(30);
    if(error) throw error; return data||[];
  }
};
