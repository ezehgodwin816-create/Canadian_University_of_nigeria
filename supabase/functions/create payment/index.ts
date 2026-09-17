import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function response(
  body: Record<string, unknown>,
  status = 200
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    });
  }

  if (req.method !== 'POST') {
    return response(
      { error: 'Method Not Allowed' },
      405
    );
  }

  try {
    const supabaseUrl =
      Deno.env.get('SUPABASE_URL');

    const supabaseAnonKey =
      Deno.env.get('SUPABASE_ANON_KEY');

    const serviceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      !serviceRoleKey
    ) {
      console.error(
        'Missing Supabase environment variables'
      );

      return response(
        { error: 'Server configuration error' },
        500
      );
    }

    const authorization =
      req.headers.get('Authorization');

    if (!authorization) {
      return response(
        { error: 'Unauthorized' },
        401
      );
    }

    /*
     * Client using the student's JWT.
     * This is used only to identify the authenticated user.
     */
    const userClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authorization
          }
        }
      }
    );

    const {
      data: {
        user
      },
      error: authError
    } = await userClient.auth.getUser();

    if (authError || !user) {
      console.error(
        'Authentication error:',
        authError
      );

      return response(
        { error: 'Unauthorized' },
        401
      );
    }

    /*
     * Service-role client is used only inside this
     * trusted Edge Function for the payment insert.
     *
     * The service-role key is NEVER returned to
     * the browser.
     */
    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    const body = await req.json();

    const feeRecordId =
      body?.fee_record_id || null;

    /*
     * When a fee record is supplied, retrieve the
     * actual fee from the database rather than trusting
     * an amount supplied by the browser.
     */
    let amount: number;

    if (feeRecordId) {
      const {
        data: fee,
        error: feeError
      } = await adminClient
        .from('fee_records')
        .select(
          'id, student_id, amount, status'
        )
        .eq('id', feeRecordId)
        .maybeSingle();

      if (feeError) {
        console.error(
          'Fee lookup error:',
          feeError
        );

        return response(
          { error: 'Could not verify fee' },
          500
        );
      }

      if (!fee) {
        return response(
          { error: 'Fee record not found' },
          404
        );
      }

      /*
       * Critical ownership check.
       */
      if (fee.student_id !== user.id) {
        return response(
          { error: 'You cannot pay this fee' },
          403
        );
      }

      const status =
        String(fee.status || '')
          .toLowerCase();

      if (
        status === 'paid' ||
        status === 'settled' ||
        status === 'cancelled'
      ) {
        return response(
          { error: 'This fee is not payable' },
          400
        );
      }

      amount = Number(fee.amount);
    } else {
      /*
       * Only allow an amount when no fee record was
       * supplied. This keeps the function compatible
       * with the existing frontend while still validating
       * the value.
       */
      amount = Number(body?.amount);
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return response(
        { error: 'Invalid payment amount' },
        400
      );
    }

    /*
     * Paystack expects the amount in kobo.
     * Example: ₦5,000 = 500000 kobo.
     */
    const amountInKobo =
      Math.round(amount * 100);

    const reference =
      `CUN-${Date.now()}-${crypto
        .randomUUID()
        .replaceAll('-', '')
        .slice(0, 12)}`;

    /*
     * Store the pending payment.
     *
     * IMPORTANT:
     * This insert happens server-side using the
     * service-role client, so the student's normal
     * payments INSERT RLS restriction is preserved.
     */
    const paymentData: Record<string, unknown> = {
      student_id: user.id,
      amount,
      reference,
      provider: 'paystack',
      status: 'pending'
    };

    if (feeRecordId) {
      paymentData.fee_record_id =
        feeRecordId;
    }

    const {
      error: paymentError
    } = await adminClient
      .from('payments')
      .insert(paymentData);

    if (paymentError) {
      console.error(
        'Payment insert error:',
        paymentError
      );

      return response(
        {
          error:
            'Could not create payment reference'
        },
        500
      );
    }

    /*
     * Return only information required by the
     * frontend. Never return secrets.
     */
    return response({
      success: true,
      reference,
      amount,
      amount_in_kobo: amountInKobo,
      currency: 'NGN',
      email: user.email
    });

  } catch (error) {
    console.error(
      'create-payment error:',
      error
    );

    return response(
      {
        error:
          'Could not create payment reference'
      },
      500
    );
  }
});
