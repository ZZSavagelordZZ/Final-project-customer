'use client';

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Navi } from "../head/navi";
import { Footer } from "../head/footer";
import { useUser } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { Loader2 } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export const GoldenSubscribe = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  const initializePaymentSession = useMutation(api.payment.createPaymentSession);

  const plans = [
    {
      id: 'silver_elite',
      name: 'Silver Elite',
      price: 199,
      features: [
        '2 Premium rentals per month',
        'Basic chauffeur service',
        'Standard travel kit',
        '10% reward points bonus'
      ]
    },
    {
      id: 'gold_elite',
      name: 'Gold Elite',
      price: 399,
      features: [
        '4 Premium rentals per month',
        'Priority chauffeur service',
        'Luxury travel kit',
        '25% reward points bonus'
      ]
    },
    {
      id: 'platinum_elite',
      name: 'Platinum Elite',
      price: 799,
      features: [
        'Unlimited Premium rentals',
        '24/7 dedicated chauffeur',
        'Premium travel kit + extras',
        '50% reward points bonus'
      ]
    }
  ];

  const handleSubscribe = async (planId: string) => {
    try {
      setIsLoading(true);
      setSelectedPlan(planId);

      if (!user) {
        router.push('/sign-in');
        return;
      }

      const selectedPlanDetails = plans.find(p => p.id === planId);
      if (!selectedPlanDetails) {
        throw new Error('Invalid plan selected');
      }

      // Create payment session
      const result = await initializePaymentSession({
        paidAmount: 0,
        userId: user.id,
        status: 'pending',
        totalAmount: selectedPlanDetails.price,
        isSubscription: true,
        subscriptionPlan: planId
      });

      const sessionId = result?.sessionId;
      if (!sessionId) {
        throw new Error('Failed to create payment session: No session ID returned');
      }

      // Create Stripe subscription
      const response = await fetch('/api/subscription-creation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          email: user.emailAddresses[0].emailAddress,
          sessionId: sessionId,
          userId: user.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create subscription');
      }

      const { clientSecret } = await response.json();
      if (!clientSecret) {
        throw new Error('No client secret received');
      }

      router.push(`/Golden/subscribe/payment?plan=${planId}&sessionId=${sessionId}&clientSecret=${clientSecret}`);
    } catch (error: any) {
      console.error('Subscription initialization failed:', error);
      // Consider adding error state and displaying to user
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navi />
      <Separator />
      <main className="flex-1 container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Choose Your Elite Membership</h1>
          <p className="text-muted-foreground">Select the plan that best suits your luxury lifestyle</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative flex flex-col items-center justify-center p-0 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl bg-card hover:bg-gradient-to-r from-blue-500 to-green-500 border-none hover:z-50 ${
                selectedPlan === plan.id ? 'ring-2 ring-primary' : ''
              }`}
              style={{ border: "none" }}
            >
              <CardHeader>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <p className="text-3xl font-bold">${plan.price}<span className="text-sm">/month</span></p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckIcon className="h-5 w-5 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="flex justify-center">
                  <Button
                    className="hover:bg-blue-500 hover:shadow-lg transition-all duration-300 rounded-lg mt-0 mb-5 hover:bg-muted"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isLoading}
                  >
                    {isLoading && selectedPlan === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Subscribe Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

const CheckIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
