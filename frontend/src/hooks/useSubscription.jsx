import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState(null);
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [statusRes, limitsRes] = await Promise.all([
        api.get('/billing/status'),
        api.get('/billing/limits'),
      ]);
      setSubscription(statusRes.data);
      setLimits(limitsRes.data);
    } catch {
      // Not logged in or server error — keep null
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isPro = subscription?.subscription_tier === 'pro';

  return (
    <SubscriptionContext.Provider value={{ subscription, limits, loading, isPro, refresh }}>
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
