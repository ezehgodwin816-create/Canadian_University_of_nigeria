/**
 * Core app utilities
 */

function sanitize(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" });
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function generateAppNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `CUN/${year}/${rand}`;
}

// LocalStorage helpers for demo persistence
const Store = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(key);
  }
};

window.sanitize = sanitize;
window.formatDate = formatDate;
window.getQueryParam = getQueryParam;
window.generateAppNumber = generateAppNumber;
window.Store = Store;

/* Supabase bootstrap — uses only the public anon key. */
(function(){
  const cfg=window.CUN_CONFIG||{};
  if(!cfg.useSupabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;
  const tag=document.createElement("script");
  tag.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  tag.onload=()=>{
    if(window.supabase?.createClient){
      window.SupabaseClient=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
      });
    }
  };
  document.head.appendChild(tag);
})();

/* Payment + document services. Keep provider secrets on the server. */
window.CUNPayments = {
  async loadPaystack() {
    if (window.PaystackPop) return true;
    return new Promise(resolve=>{
      const script=document.createElement("script");
      script.src="https://js.paystack.co/v2/inline.js";
      script.onload=()=>resolve(!!window.PaystackPop);
      script.onerror=()=>resolve(false);
      document.head.appendChild(script);
    });
  },
  async open({email,amount,reference,onSuccess,onCancel}) {
    const cfg=window.CUN_CONFIG||{};
    if(!cfg.paymentPublicKey) throw new Error("Payment gateway is not configured.");
    const ok=await this.loadPaystack();
    if(!ok) throw new Error("Payment gateway could not be loaded.");
    const popup=new PaystackPop();
    popup.newTransaction({
      key:cfg.paymentPublicKey,
      email, amount:Math.round(Number(amount)*100), reference,
      onSuccess: result=>onSuccess?.(result),
      onCancel: ()=>onCancel?.()
    });
  }
};

window.CUNDocuments = {
  async upload(file, userId, applicationId) {
    if(!window.SupabaseClient) throw new Error("Storage is not configured.");
    if(!file || !userId || !applicationId) throw new Error("Missing document context.");
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"-");
    const path=`${userId}/${applicationId}/${crypto.randomUUID()}-${safe}`;
    const {data,error}=await window.SupabaseClient.storage
      .from((window.CUN_CONFIG||{}).storageBucket||"application-documents")
      .upload(path,file,{upsert:false,contentType:file.type||"application/octet-stream"});
    if(error) throw error;
    return data;
  }
};
