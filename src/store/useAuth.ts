import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/**
 * Auth state. Growth-first: users can start instantly with anonymous sign-in,
 * and optionally attach an email/password later to keep their journey.
 */
interface AuthState {
  session: Session | null;
  user: User | null;
  initialized: boolean;
  init: () => () => void;
  startAnonymously: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  /** Convert the current anonymous guest into a permanent account — SAME user id, so no data is lost. */
  upgradeAccount: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  session: null,
  user: null,
  initialized: false,

  init: () => {
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, user: data.session?.user ?? null, initialized: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, initialized: true });
    });
    return () => sub.subscription.unsubscribe();
  },

  startAnonymously: async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  },

  signInWithPassword: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signUpWithPassword: async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  },

  upgradeAccount: async (email, password) => {
    // Updating an anonymous user with email + password converts it to a
    // permanent account while keeping the SAME user id — every goal, message,
    // and streak stays intact.
    const { error } = await supabase.auth.updateUser({ email, password });
    if (error) throw error;
    // Refresh local user so the UI reflects the now-permanent account.
    const { data } = await supabase.auth.getUser();
    if (data.user) set({ user: data.user });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));
