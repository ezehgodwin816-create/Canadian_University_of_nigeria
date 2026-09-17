import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
}

function env(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { status: 200, headers: cors });
  if (req.method !== 'POST') return response({ error: 'Method Not Allowed' }, 405);

  try {
    const authorization = req.headers.get('authorization');
    if (!authorization) return response({ error: 'Unauthorized' }, 401);

    const supabaseUrl = env('SUPABASE_URL');
    const anonKey = env('SUPABASE_ANON_KEY');
    const serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY');

    const userDb = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } }
    });
    const adminDb = createClient(supabaseUrl, serviceRoleKey);

    const { data: authData, error: authError } = await userDb.auth.getUser();
    const user = authData?.user;
    if (authError || !user) return response({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const feeRecordId = body?.fee_record_id ? String(body.fee_record_id) : null;
    let amount = Number(body?.amount);

    if (feeRecordId) {
      const { data: fee, error: feeError } = await adminDb
        .from('fee_records')
        .select('id, student_id, amount, status')
        .eq('id', feeRecordId)
        .maybeSingle();

      if (feeError) throw feeError;
      if (!fee || fee.student_id !== user.id) {
        return response({ error: 'Invalid fee record' }, 403);
      }

      const status = String(fee.status || '').toLowerCase();
      if (['paid', 'settled', 'cancelled'].includes(status)) {
        return response({ error: 'Fee is not payable' }, 400);
      }

      amount = Number(fee.amount);
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return response({ error: 'Invalid amount' }, 400);
    }

    const reference = `CUN-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    const { error: paymentError } = await adminDb
      .from('payments')
      .insert({
        student_id: user.id,
        fee_record_id: feeRecordId,
        amount,
        reference,
        provider: 'paystack',
        status: 'pending'
      });

    if (paymentError) throw paymentError;

    return response({
      reference,
      amount,
      currency: 'NGN',
      email: user.email
    });
  } catch (error) {
    console.error('create-payment error:', error);
    return response({ error: 'Could not create payment' }, 500);
  }
});
