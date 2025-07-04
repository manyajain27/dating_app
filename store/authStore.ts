import { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// Updated Profile interface to match form data
interface Profile {
  id: string;
  email: string;
  name: string;
  bio: string;
  age: number;
  gender: string;
  interested_in: string;
  location_city: string;
  location_state: string;
  location_country: string;
  profile_pictures: string[];
  interests: string[];
  occupation: string;
  education: string;
  height: string;
  looking_for: string;
  is_verified: boolean;
  is_premium: boolean;
  last_active: string;
  created_at: string;
  updated_at: string;
  date_of_birth: string;
  star_sign: string;
  believes_in_star_signs: string;
  children: string;
  teasers: Record<string, string>;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  isTabBarVisible: boolean; // Added for tab bar visibility
  setTabBarVisible: (isVisible: boolean) => void; // Added for tab bar visibility
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: false,
  initialized: false,
  isTabBarVisible: true, // Initial state for tab bar

  // Function to update tab bar visibility
  setTabBarVisible: (isVisible) => set({ isTabBarVisible: isVisible }),

  initialize: async () => {
    try {
      set({ loading: true });
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        set({ session, user: session.user });
        await get().fetchProfile();
      }
      
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (session) {
          set({ session, user: session.user });
          await get().fetchProfile();
        } else {
          set({ session: null, user: null, profile: null });
        }
      });
      
      set({ initialized: true });
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    try {
      set({ loading: true });
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email, password) => {
    try {
      set({ loading: true });
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error };
      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true });
      await supabase.auth.signOut();
      set({ session: null, user: null, profile: null });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchProfile: async () => {
    try {
      const { user } = get();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      set({ profile });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  },

  updateProfile: async (updates) => {
    try {
      const { user } = get();
      if (!user) return { error: { message: 'No user logged in' } };

      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (error) return { error };

      set({ profile: data });
      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error };
    }
  },
}));
