import { supabase } from './supabase';
import { products, getProductByPriceId } from '../stripe-config';

interface CreateCheckoutSessionParams {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
  mode?: 'payment' | 'subscription';
}

export async function createCheckoutSession({
  priceId,
  successUrl = `${window.location.origin}/payment/success`,
  cancelUrl = `${window.location.origin}/payment/cancel`,
  mode = 'payment',
}: CreateCheckoutSessionParams) {
  try {
    // Validate that the price ID exists in our products
    const product = getProductByPriceId(priceId);
    if (!product) {
      throw new Error('Invalid product selected');
    }

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      throw new Error('You must be logged in to make a purchase');
    }

    // Call the edge function
    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: {
        price_id: priceId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        mode: mode,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      throw error;
    }

    if (!data?.url) {
      throw new Error('Failed to create checkout session');
    }

    return data;
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    throw new Error(error.message || 'Failed to create checkout session');
  }
}

export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100);
}

export { products, getProductByPriceId };