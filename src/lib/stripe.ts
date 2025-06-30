import { supabase } from './supabase';

export interface CreateCheckoutSessionParams {
  surveyId: string;
  surveyTitle: string;
  price: number;
  currency: string;
  researcherId: string;
  surveyLinkConfig: {
    maxResponses: number;
    expiresAt?: string;
    allowAnonymous: boolean;
    requireConsent: boolean;
    requireIdentification: boolean;
    passwordProtected: boolean;
    accessPassword?: string;
    showResultsToRespondent: boolean;
  };
}

export async function validatePrice(price: number): Promise<void> {
  if (typeof price !== 'number' || isNaN(price)) {
    throw new Error('Price must be a valid number');
  }
  
  if (price <= 0) {
    throw new Error('Price must be greater than 0');
  }
  
  if (price > 999999.99) {
    throw new Error('Price cannot exceed $999,999.99');
  }
  
  // Check for more than 2 decimal places
  const decimalPlaces = (price.toString().split('.')[1] || '').length;
  if (decimalPlaces > 2) {
    throw new Error('Price cannot have more than 2 decimal places');
  }
}

export function validateCurrency(currency: string): void {
  const supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
  if (!supportedCurrencies.includes(currency)) {
    throw new Error(`Unsupported currency: ${currency}. Supported: ${supportedCurrencies.join(', ')}`);
  }
}

export function formatPrice(price: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(price);
}

export async function createCheckoutSession(params: CreateCheckoutSessionParams) {
  try {
    // Validate inputs
    validatePrice(params.price);
    validateCurrency(params.currency);

    // Get auth session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error('Authentication required');
    }

    // Call the edge function
    const { data, error } = await supabase.functions.invoke('create-checkout-session', {
      body: params,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to create checkout session');
    }

    if (!data?.url) {
      throw new Error('No checkout URL returned');
    }

    return data;
  } catch (error) {
    console.error('Checkout session creation error:', error);
    throw error;
  }
}

export async function getPaymentStatus(sessionId: string) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error('Authentication required');
    }

    // First get the payment session to find the survey link
    const { data: paymentSession, error: sessionError2 } = await supabase
      .from('payment_sessions')
      .select(`
        *,
        survey:surveys(id, title, description)
      `)
      .eq('stripe_checkout_session_id', sessionId)
      .single();

    if (sessionError2) {
      throw new Error('Payment session not found');
    }

    let surveyLink = null;
    if (paymentSession.survey_link_id) {
      // Get the survey link details
      const { data: linkData, error: linkError } = await supabase
        .from('survey_links')
        .select('*')
        .eq('id', paymentSession.survey_link_id)
        .single();

      if (!linkError && linkData) {
        surveyLink = linkData;
      }
    }

    return {
      ...paymentSession,
      survey_link: surveyLink,
    };
  } catch (error) {
    console.error('Payment status check error:', error);
    throw error;
  }
}