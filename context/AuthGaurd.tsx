// components/AuthGuard.tsx
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const { session, initialized, loading } = useAuthStore();

  useEffect(() => {
    if (!initialized || loading) return;

    if (requireAuth && !session) {
      // User is not authenticated, redirect to auth screen
      router.replace('/');
    } else if (!requireAuth && session) {
      // User is authenticated but on auth screen, redirect to main app
      router.replace('/(tabs)/swipe');
    }
  }, [session, initialized, loading, requireAuth]);

  // Don't render anything while checking auth state
  if (!initialized || loading) {
    return null;
  }

  // If auth is required but user is not authenticated, don't render children
  if (requireAuth && !session) {
    return null;
  }

  // If auth is not required but user is authenticated, don't render children
  if (!requireAuth && session) {
    return null;
  }

  return <>{children}</>;
};