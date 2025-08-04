import React, { useState } from 'react';
import { Check, Crown, Zap, Star, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  yearlyPrice: number;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  icon: React.ComponentType<any>;
  color: string;
}

export const SubscriptionPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      yearlyPrice: 0,
      description: 'Perfect for getting started',
      icon: Star,
      color: 'gray',
      features: [
        { text: '1 Trading Bot', included: true },
        { text: 'Basic Grid Strategy', included: true },
        { text: '$1,000 Max Investment', included: true },
        { text: 'Email Support', included: true },
        { text: 'Advanced Strategies', included: false },
        { text: 'Signal Bots', included: false },
        { text: 'Copy Trading', included: false },
        { text: 'Priority Support', included: false },
      ],
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 29,
      yearlyPrice: 290,
      description: 'For serious traders',
      icon: Zap,
      color: 'blue',
      features: [
        { text: '5 Trading Bots', included: true },
        { text: 'All Basic Strategies', included: true },
        { text: '$10,000 Max Investment', included: true },
        { text: 'Email & Chat Support', included: true },
        { text: 'Advanced Analytics', included: true },
        { text: 'Signal Bots', included: false },
        { text: 'Copy Trading', included: false },
        { text: 'API Access', included: false },
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 99,
      yearlyPrice: 990,
      description: 'For professional traders',
      icon: Crown,
      color: 'purple',
      popular: true,
      features: [
        { text: '20 Trading Bots', included: true },
        { text: 'All Strategies', included: true },
        { text: '$100,000 Max Investment', included: true },
        { text: 'Priority Support', included: true },
        { text: 'Advanced Analytics', included: true },
        { text: 'Signal Bots', included: true },
        { text: 'Copy Trading', included: true },
        { text: 'API Access', included: true },
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299,
      yearlyPrice: 2990,
      description: 'For institutions',
      icon: Crown,
      color: 'gold',
      features: [
        { text: 'Unlimited Bots', included: true },
        { text: 'All Strategies', included: true },
        { text: 'Unlimited Investment', included: true },
        { text: 'Dedicated Support', included: true },
        { text: 'Custom Analytics', included: true },
        { text: 'White-label Solution', included: true },
        { text: 'Custom Integrations', included: true },
        { text: 'SLA Guarantee', included: true },
      ],
    },
  ];

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    
    try {
      // Here you would integrate with Stripe or your payment processor
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirect to payment processor or handle subscription
      console.log(`Subscribing to ${planId} plan`);
      
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(null);
    }
  };

  const getCurrentPlan = () => {
    return userProfile?.subscription_tier || 'free';
  };

  const getPrice = (plan: SubscriptionPlan) => {
    return billingCycle === 'yearly' ? plan.yearlyPrice : plan.price;
  };

  const getSavings = (plan: SubscriptionPlan) => {
    if (plan.price === 0) return 0;
    const monthlyTotal = plan.price * 12;
    const savings = monthlyTotal - plan.yearlyPrice;
    return Math.round((savings / monthlyTotal) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Trading Plan</h1>
          <p className="text-xl text-gray-400 mb-8">
            Unlock the full potential of automated crypto trading
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`${billingCycle === 'yearly' ? 'text-white' : 'text-gray-400'}`}>
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <span className="px-2 py-1 bg-green-600 bg-opacity-20 text-green-400 text-xs rounded-full">
                Save up to 17%
              </span>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const currentPlan = getCurrentPlan();
            const isCurrentPlan = currentPlan === plan.id;
            const price = getPrice(plan);
            const savings = getSavings(plan);
            
            return (
              <div
                key={plan.id}
                className={`relative bg-gray-800 rounded-2xl p-8 border-2 transition-all duration-300 hover:scale-105 ${
                  plan.popular
                    ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                    : isCurrentPlan
                    ? 'border-green-500'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className={`inline-flex p-3 rounded-full bg-${plan.color}-600 bg-opacity-20 mb-4`}>
                    <Icon className={`w-8 h-8 text-${plan.color}-400`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-400 mb-4">{plan.description}</p>
                  
                  <div className="mb-4">
                    <span className="text-4xl font-bold">
                      ${price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-400">
                        /{billingCycle === 'yearly' ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                  
                  {billingCycle === 'yearly' && savings > 0 && (
                    <div className="text-green-400 text-sm font-semibold">
                      Save {savings}% annually
                    </div>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                        feature.included ? 'bg-green-600' : 'bg-gray-600'
                      }`}>
                        {feature.included ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : (
                          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                        )}
                      </div>
                      <span className={feature.included ? 'text-white' : 'text-gray-400'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading === plan.id || isCurrentPlan}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                    isCurrentPlan
                      ? 'bg-green-600 text-white cursor-default'
                      : plan.popular
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  } ${loading === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading === plan.id ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : isCurrentPlan ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Current Plan</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>{plan.price === 0 ? 'Get Started' : 'Subscribe'}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Can I change my plan anytime?</h3>
              <p className="text-gray-400 text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-400 text-sm">
                We accept all major credit cards, PayPal, and cryptocurrency payments.
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-gray-400 text-sm">
                Yes, all paid plans come with a 7-day free trial. No credit card required.
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-400 text-sm">
                Absolutely. You can cancel your subscription at any time with no cancellation fees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};