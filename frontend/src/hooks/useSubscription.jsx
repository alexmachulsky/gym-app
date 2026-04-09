import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const SubscriptionContext = createContext(null);

function getTrialDaysLeft(trialEndsAt) {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState(null);
  const [limits, setLimits] = useState(null);
  const [trialEndsAt, setTrialEndsAt] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [statusRes, limitsRes, meRes] = await Promise.all([
        api.get('/billing/status'),
        api.get('/billing/limits'),
        api.get('/auth/me'),
      ]);
      setSubscription(statusRes.data);
      setLimits(limitsRes.data);
      setTrialEndsAt(meRes.data.trial_ends_at || null);
    } catch {
      // Not logged in or server error — keep null
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isPaidPro = subscription?.subscription_tier === 'pro';
  const trialDaysLeft = !isPaidPro ? getTrialDaysLeft(trialEndsAt) : 0;
  const isOnTrial = trialDaysLeft > 0;
  const isPro = isPaidPro || isOnTrial;

  return (
    <SubscriptionContext.Provider value={{ subscription, limits, loading, isPro, isPaidPro, isOnTrial, trialDaysLeft, trialEndsAt, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
