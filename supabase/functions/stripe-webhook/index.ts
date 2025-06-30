import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14';
import { corsHeaders, handleCors, createResponse } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method !== 'POST') {
      return createResponse({ error: 'Method not allowed' }, 405);
    }

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return createResponse({ error: 'Missing stripe signature' }, 400);
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return createResponse({ error: 'Invalid signature' }, 400);
    }

    console.log('Processing webhook event:', event);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;
      
      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge);
        break;
      
      default:
        console.log('Unhandled event type:', event.type);
    }

    return createResponse({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return createResponse({ error: 'Webhook processing failed' }, 500);
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const metadata = session.metadata;
    if (!metadata) {
      console.error('No metadata in checkout session');
      return;
    }

    const { survey_id, researcher_id, payment_session_id, survey_link_config } = metadata;
    
    if (!survey_id || !researcher_id || !payment_session_id || !survey_link_config) {
      console.error('Missing required metadata');
      return;
    }

    // Parse survey link configuration
    const linkConfig = JSON.parse(survey_link_config);

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        survey_id,
        researcher_id,
        stripe_payment_intent_id: session.payment_intent as string,
        stripe_checkout_session_id: session.id,
        amount: (session.amount_total || 0) / 100,
        currency: session.currency?.toUpperCase() || 'USD',
        status: 'succeeded',
        completed_at: new Date().toISOString(),
        metadata: { checkout_session: session.id },
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError);
      return;
    }

    // Create survey link
    const { data: surveyLink, error: linkError } = await supabase
      .from('survey_links')
      .insert({
        survey_id,
        researcher_id,
        payment_id: payment.id,
        is_paid: true,
        max_responses: linkConfig.maxResponses,
        expires_at: linkConfig.expiresAt || null,
        allow_anonymous: linkConfig.allowAnonymous,
        require_consent: linkConfig.requireConsent,
        require_identification: linkConfig.requireIdentification,
        password_protected: linkConfig.passwordProtected,
        access_password: linkConfig.passwordProtected ? linkConfig.accessPassword : null,
        show_results_to_respondent: linkConfig.showResultsToRespondent,
        active: true,
      })
      .select()
      .single();

    if (linkError) {
      console.error('Failed to create survey link:', linkError);
      return;
    }

    // Update payment session status and link it to the created survey link
    await supabase
      .from('payment_sessions')
      .update({ 
        status: 'completed',
        survey_link_id: surveyLink.id 
      })
      .eq('id', payment_session_id);

    console.log('Successfully processed checkout completion for survey link:', surveyLink.id);

  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    await supabase
      .from('payments')
      .update({ 
        status: 'succeeded',
        completed_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    console.log('Payment succeeded:', paymentIntent.id);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    await supabase
      .from('payments')
      .update({ 
        status: 'failed',
        failed_at: new Date().toISOString(),
        failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
      })
      .eq('stripe_payment_intent_id', paymentIntent.id);

    console.log('Payment failed:', paymentIntent.id);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handleDisputeCreated(dispute: Stripe.Dispute) {
  try {
    // Find the payment and deactivate associated survey link
    const { data: payment } = await supabase
      .from('payments')
      .select('id')
      .eq('stripe_payment_intent_id', dispute.payment_intent as string)
      .single();

    if (payment) {
      // Deactivate survey link
      await supabase
        .from('survey_links')
        .update({ active: false })
        .eq('payment_id', payment.id);

      // Update payment status
      await supabase
        .from('payments')
        .update({ 
          status: 'failed',
          failure_reason: `Dispute created: ${dispute.reason}`,
          failed_at: new Date().toISOString(),
        })
        .eq('id', payment.id);
    }

    console.log('Dispute created:', dispute.id);
  } catch (error) {
    console.error('Error handling dispute:', error);
  }
}

async function handleRefund(charge: Stripe.Charge) {
  try {
    // Find the payment and deactivate associated survey link
    const { data: payment } = await supabase
      .from('payments')
      .select('id')
      .eq('stripe_payment_intent_id', charge.payment_intent as string)
      .single();

    if (payment) {
      // Deactivate survey link
      await supabase
        .from('survey_links')
        .update({ active: false })
        .eq('payment_id', payment.id);

      // Update payment status
      await supabase
        .from('payments')
        .update({ 
          status: 'failed',
          failure_reason: 'Payment refunded',
          failed_at: new Date().toISOString(),
        })
        .eq('id', payment.id);
    }

    console.log('Refund processed:', charge.id);
  } catch (error) {
    console.error('Error handling refund:', error);
  }
}