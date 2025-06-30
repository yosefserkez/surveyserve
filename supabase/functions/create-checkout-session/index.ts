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

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    if (req.method !== 'POST') {
      return createResponse({ error: 'Method not allowed' }, 405, req);
    }

    const { 
      surveyId, 
      surveyTitle, 
      price, 
      currency, 
      researcherId, 
      surveyLinkConfig 
    } = await req.json();

    // Validate required fields
    if (!surveyId || !surveyTitle || !price || !researcherId || !surveyLinkConfig) {
      return createResponse({ error: 'Missing required fields' }, 400, req);
    }

    // Validate price
    if (price <= 0 || price > 999999.99) {
      return createResponse({ error: 'Invalid price amount' }, 400, req);
    }

    // Validate currency
    const supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
    if (!supportedCurrencies.includes(currency)) {
      return createResponse({ error: 'Unsupported currency' }, 400, req);
    }

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createResponse({ error: 'Authorization header required' }, 401, req);
    }

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return createResponse({ error: 'Invalid user token' }, 401, req);
    }

    if (user.id !== researcherId) {
      return createResponse({ error: 'User mismatch' }, 403, req);
    }

    // Create payment session record
    const { data: paymentSession, error: sessionError } = await supabase
      .from('payment_sessions')
      .insert({
        survey_id: surveyId,
        researcher_id: researcherId,
        status: 'pending',
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Payment session creation error:', sessionError);
      return createResponse({ error: 'Failed to create payment session' }, 500, req);
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Survey: ${surveyTitle}`,
              description: `Create survey link for "${surveyTitle}"`,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/payment/cancel?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        survey_id: surveyId,
        researcher_id: researcherId,
        payment_session_id: paymentSession.id,
        survey_link_config: JSON.stringify(surveyLinkConfig),
      },
    });

    // Update payment session with Stripe session ID
    await supabase
      .from('payment_sessions')
      .update({ stripe_checkout_session_id: session.id })
      .eq('id', paymentSession.id);

    return createResponse({
      sessionId: session.id,
      url: session.url,
      paymentSessionId: paymentSession.id,
    }, 200, req);

  } catch (error) {
    console.error('Checkout session creation error:', error);
    return createResponse(
      { error: error.message || 'Failed to create checkout session' },
      500,
      req
    );
  }
});