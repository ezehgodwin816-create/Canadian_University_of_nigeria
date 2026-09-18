/* CUN AI Concierge — safe browser layer.
   It first uses the public CUN data catalogue for deterministic answers.
   If /functions/v1/cun-ai is deployed with a server-side AI key, it can
   hand the same context to the protected Edge Function for richer answers. */
(function(){
  const messages=document.getElementById("ai-messages");
  const form=document.getElementById("ai-form");
  const input=document.getElementById("ai-input");
  if(!messages||!form||!input) return;

  const pages=[
    ["Admissions","admissions.html","admissions, application, entry, apply, requirements"],
    ["Programmes","programmes.html","programmes, courses, degree, study"],
    ["Faculties","faculties.html","faculties, academic areas"],
    ["Departments","departments.html","departments"],
    ["Fees & Payments","fees.html","fees, tuition, payments"],
    ["Scholarships","scholarships.html","scholarships, funding"],
    ["Academic Calendar","academic-calendar.html","calendar, semester, academic dates"],
    ["Student Support","student-support.html","support, help, welfare, counselling"],
    ["Accommodation","accommodation.html","hostel, accommodation, housing"],
    ["Library","library.html","library, books, learning resources"],
    ["Research","research.html","research, projects, publications"],
    ["Careers","careers.html","careers, jobs, employment"],
    ["Contact","contact.html","contact, address, office"],
    ["Application Status","application-status.html","application status, track application"],
    ["CUN AI Concierge","ai-assistant.html","ai, assistant, help"]
  ];

  function add(role,text){
    const el=document.createElement("div");
    el.className="ai-message "+role;
    el.textContent=text;
    messages.appendChild(el);
    messages.scrollTop=messages.scrollHeight;
  }

  function normal(s){return String(s||"").toLowerCase().replace(/[^\w\s]/g," ");}
  function context(){
    const d=window.CUN_DATA||{};
    return {
      university:d.university||{},
      stats:d.stats||[],
      faculties:(d.faculties||[]).map(x=>({id:x.id,name:x.name,description:x.description,programmes:x.programmes})),
      programmes:(d.programmes||[]).map(x=>({id:x.id,name:x.name,faculty:x.faculty,level:x.level})),
      pages
    };
  }

  function localAnswer(q){
    const n=normal(q);
    if(/\b(hello|hi|hey|good morning|good afternoon|good evening)\b/.test(n))
      return "Hello. I’m the CUN web concierge. Ask me about admissions, programmes, faculties, fees, student support, accommodation, research, the library or other public university information.";

    if(/\b(who|what).*(cun|university)|about cun|about the university/.test(n)){
      const u=context().university;
      return `${u.name||"Canadian University of Nigeria"} is presented on this website as a private university in ${u.location||"Abuja, Nigeria"}. ${u.tagline||""}`.trim();
    }

    const matches=pages.filter(p=>normal(p[2]).split(/\s+/).some(k=>k && n.includes(k)));
    if(matches.length){
      const unique=[...new Map(matches.map(x=>[x[1],x])).values()].slice(0,4);
      return "I found the most relevant CUN pages:\n" + unique.map(x=>`• ${x[0]} — ${x[1]}`).join("\n") +
        "\n\nOpen the relevant page for the full current information.";
    }

    const d=window.CUN_DATA||{};
    const programmes=d.programmes||[];
    if(/\b(programme|programmes|course|courses|degree)\b/.test(n) && programmes.length){
      return "The current CUN catalogue includes:\n" + programmes.slice(0,12).map(x=>`• ${x.name||x.title}`).join("\n") +
        (programmes.length>12?`\n…and ${programmes.length-12} more on programmes.html.`:"");
    }

    return "I can help you find information across the CUN website. Try asking about admissions, entry requirements, programmes, faculties, fees, scholarships, academic calendar, accommodation, student support, library, research, careers or contact information.";
  }

  async function remoteAnswer(q){
    const base=window.CUN_CONFIG?.supabaseUrl;
    if(!base) return null;
    const endpoint=(window.CUN_CONFIG?.aiEndpoint||`${base}/functions/v1/cun-ai`).trim();
    if(!endpoint) return null;
    const payload={question:q,context:context()};
    const headers={"Content-Type":"application/json"};
    if(window.CUN_CONFIG?.supabaseAnonKey) headers.apikey=window.CUN_CONFIG.supabaseAnonKey;
    try{
      const session=await window.SupabaseClient?.auth?.getSession?.();
      const token=session?.data?.session?.access_token;
      if(token) headers.Authorization=`Bearer ${token}`;
    }catch{}
    const res=await fetch(endpoint,{method:"POST",headers,body:JSON.stringify(payload)});
    if(!res.ok) return null;
    const data=await res.json();
    return data?.answer||data?.output||null;
  }

  add("assistant","Welcome to the CUN AI Concierge. Ask me anything about the public CUN website.");
  form.addEventListener("submit",async e=>{
    e.preventDefault();
    const q=input.value.trim();
    if(!q) return;
    input.value="";
    add("user",q);
    const send=form.querySelector("button[type=submit]");
    if(send) send.disabled=true;
    let answer=null;
    try{ answer=await remoteAnswer(q); }catch{}
    add("assistant",answer||localAnswer(q));
    if(send) send.disabled=false;
    input.focus();
  });
})();
