import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods':
    'POST, OPTIONS'
};

function jsonResponse(
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

async function createSignature(
  secret: string,
  body: string
) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    {
      name: 'HMAC',
      hash: 'SHA-512'
    },
    false,
    ['sign']
  );

  const signature =
    await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(body)
    );

  return Array.from(
    new Uint8Array(signature)
  )
    .map(
      byte =>
        byte.toString(16).padStart(2, '0')
    )
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      { error: 'Method Not Allowed' },
      405
    );
  }

  try {
    const supabaseUrl =
      Deno.env.get('SUPABASE_URL');

    const serviceRoleKey =
      Deno.env.get(
        'SUPABASE_SERVICE_ROLE_KEY'
      );

    const paystackSecret =
      Deno.env.get(
        'PAYSTACK_SECRET_KEY'
      );

    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      !paystackSecret
    ) {
      console.error(
        'Missing required environment variables'
      );

      return jsonResponse(
        { error: 'Server configuration error' },
        500
      );
    }

    /*
     * Paystack signs the exact raw request body.
     */
    const rawBody = await req.text();

    const receivedSignature =
      req.headers.get(
        'x-paystack-signature'
      ) || '';

    const expectedSignature =
      await createSignature(
        paystackSecret,
        rawBody
      );

    if (
      !receivedSignature ||
      receivedSignature !== expectedSignature
    ) {
      console.error(
        'Invalid Paystack signature'
      );

      return jsonResponse(
        { error: 'Invalid signature' },
        401
      );
    }

    const event = JSON.parse(rawBody);

    const db = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    const eventId =
      String(
        event?.data?.id ||
        event?.id ||
        crypto.randomUUID()
      );

    /*
     * Record the webhook first so the same event
     * cannot be processed repeatedly.
     */
    const {
      error: webhookInsertError
    } = await db
      .from('webhook_events')
      .insert({
        provider: 'paystack',
        event_id: eventId,
        event_type: String(
          event?.event || 'unknown'
        ),
        payload: event
      });

    /*
     * Duplicate webhook delivery is safe.
     */
    if (
      webhookInsertError?.code === '23505'
    ) {
      return jsonResponse({
        received: true,
        duplicate: true
      });
    }

    if (webhookInsertError) {
      console.error(
        'Webhook event insert error:',
        webhookInsertError
      );

      return jsonResponse(
        { error: 'Could not record webhook' },
        500
      );
    }

    /*
     * We only process successful Paystack charges.
     */
    if (
      event?.event !== 'charge.success'
    ) {
      return jsonResponse({
        received: true,
        processed: false,
        event: event?.event || null
      });
    }

    const reference =
      event?.data?.reference;

    if (!reference) {
      console.error(
        'Paystack event has no reference'
      );

      return jsonResponse(
        { error: 'Missing payment reference' },
        400
      );
    }

    /*
     * Find the CUN payment created by create-payment.
     */
    const {
      data: payment,
      error: paymentLookupError
    } = await db
      .from('payments')
      .select(
        'id, student_id, fee_record_id, amount, status, reference'
      )
      .eq('reference', reference)
      .eq('provider', 'paystack')
      .maybeSingle();

    if (paymentLookupError) {
      console.error(
        'Payment lookup error:',
        paymentLookupError
      );

      return jsonResponse(
        { error: 'Could not find payment' },
        500
      );
    }

    if (!payment) {
      console.error(
        'No CUN payment found for reference:',
        reference
      );

      return jsonResponse(
        {
          error: 'Payment record not found',
          reference
        },
        404
      );
    }

    /*
     * Mark the CUN payment as successful.
     */
    const {
      error: paymentUpdateError
    } = await db
      .from('payments')
      .update({
        status: 'success',
        paid_at: new Date().toISOString(),
        raw_response: event
      })
      .eq('id', payment.id);

    if (paymentUpdateError) {
      console.error(
        'Payment update error:',
        paymentUpdateError
      );

      return jsonResponse(
        { error: 'Could not update payment' },
        500
      );
    }

    /*
     * IMPORTANT:
     * Also mark the student's fee as paid.
     */
    if (payment.fee_record_id) {
      const {
        error: feeUpdateError
      } = await db
        .from('fee_records')
        .update({
          status: 'paid'
        })
        .eq(
          'id',
          payment.fee_record_id
        )
        .eq(
          'student_id',
          payment.student_id
        );

      if (feeUpdateError) {
        console.error(
          'Fee update error:',
          feeUpdateError
        );

        return jsonResponse(
          {
            error:
              'Payment succeeded but fee update failed',
            reference
          },
          500
        );
      }
    }

    /*
     * Record an audit event.
     */
    const {
      error: auditError
    } = await db
      .from('audit_log')
      .insert({
        action: 'payment.verified',
        entity: 'payments',
        metadata: {
          reference,
          provider: 'paystack',
          payment_id: payment.id,
          student_id: payment.student_id,
          fee_record_id:
            payment.fee_record_id || null
        }
      });

    if (auditError) {
      console.error(
        'Audit log error:',
        auditError
      );

      /*
       * Do not reverse a successful payment just
       * because audit logging failed.
       */
    }

    console.log(
      'Paystack payment verified:',
      reference
    );

    return jsonResponse({
      received: true,
      processed: true,
      reference,
      payment_status: 'success',
      fee_status:
        payment.fee_record_id
          ? 'paid'
          : 'not_linked'
    });

  } catch (error) {
    console.error(
      'paystack-webhook error:',
      error
    );

    return jsonResponse(
      {
        error:
          'Webhook processing failed'
      },
      500
    );
  }
});
