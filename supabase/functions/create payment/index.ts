import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { json, requireEnv } from '../_shared/security.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async req=>{
  if(req.method==='OPTIONS') return new Response('ok',{status:200,headers:cors});
  try{
    if(req.method!=='POST') return json({error:'Method Not Allowed'},405,cors);
    const auth=req.headers.get('authorization');
    if(!auth) return json({error:'Unauthorized'},401,cors);
    const supabaseUrl=requireEnv('SUPABASE_URL');
    const anonKey=requireEnv('SUPABASE_ANON_KEY');
    const db=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:auth}}});
    const serviceRoleKey=requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const adminDb=createClient(supabaseUrl,serviceRoleKey);
    const {data:{user},error:userError}=await db.auth.getUser();
    if(userError||!user) return json({error:'Unauthorized'},401,cors);
    const body=await req.json();
    const feeRecordId=body.fee_record_id || null;
    let amount=Number(body.amount);
    if(feeRecordId){
      const {data:fee,error:feeError}=await adminDb.from('fee_records').select('id,student_id,amount,status').eq('id',feeRecordId).maybeSingle();
      if(feeError) throw feeError;
      if(!fee || fee.student_id!==user.id) return json({error:'Invalid fee record'},403,cors);
      if(['paid','settled','cancelled'].includes(String(fee.status).toLowerCase())) return json({error:'Fee is not payable'},400,cors);
      amount=Number(fee.amount);
    }
    if(!Number.isFinite(amount)||amount<=0) return json({error:'Invalid amount'},400,cors);
    const reference=`CUN-${Date.now()}-${crypto.randomUUID().slice(0,8)}`;
    const {error}=await adminDb.from('payments').insert({
      student_id:user.id,
      fee_record_id: feeRecordId,
      amount,
      reference,
      provider:'paystack',
      status:'pending'
    });
    if(error) throw error;
    return json({reference,amount,currency:'NGN',email:user.email},200,cors);
  }catch(e){
    console.error(e);
    return json({error:'Could not create payment'},500,cors);
  }
});
