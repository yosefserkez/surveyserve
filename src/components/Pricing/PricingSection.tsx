import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { createCheckoutSession } from '../../lib/stripe-client';
import { products } from '../../stripe-config';
import { CheckCircle, Loader2, CreditCard, Crown } from 'lucide-react';

export const PricingSection: React.FC = () => {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (priceId: string) => {
    if (!user) {
      // Redirect to sign in
      window.location.href = '/signin';
      return;
    }

    try {
      setLoading(priceId);
      
      const { url } = await createCheckoutSession({
        priceId,
        mode: 'payment',
      });

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      alert(error.message || 'Failed to start checkout process');
    } finally {
      setLoading(null);
    }
  };

  const isProductOwned = (priceId: string) => {
    return subscription?.price_id === priceId && subscription?.subscription_status === 'active';
  };

  return (
    <section className="py-16">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Get access to professional survey tools and start collecting valuable research data.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {products.map((product) => {
          const isOwned = isProductOwned(product.priceId);
          const isLoading = loading === product.priceId;

          return (
            <div
              key={product.id}
              className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:shadow-lg transition-all duration-200 relative"
            >
              {isOwned && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    <Crown className="h-3 w-3" />
                    <span>Current Plan</span>
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-4">{product.description}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">$9.99</span>
                  <span className="text-gray-600 ml-2">one-time</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Create unlimited survey links</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Access to validated instruments</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Real-time scoring and analytics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Data export capabilities</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Mobile-optimized surveys</span>
                </div>
              </div>

              <button
                onClick={() => handlePurchase(product.priceId)}
                disabled={isLoading || isOwned || !user}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                  isOwned
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : !user
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : isOwned ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>Current Plan</span>
                  </>
                ) : !user ? (
                  <span>Sign In to Purchase</span>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>Get Started</span>
                  </>
                )}
              </button>

              {!user && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  <a href="/signin" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    Sign in
                  </a>{' '}
                  or{' '}
                  <a href="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    create an account
                  </a>{' '}
                  to purchase
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};