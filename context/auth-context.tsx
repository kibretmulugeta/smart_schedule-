'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profile, UserRole } from '@/types/database.types';
import { MOCK_PROFILES } from '@/lib/mock-data';
import { useToast } from './toast-context';

interface AuthContextType {
  currentUser: Profile | null;
  allProfiles: Profile[];
  isAdmin: boolean;
  isAuthenticated: boolean;
  switchUser: (profileId: string) => void;
  loginUser: (email: string, password?: string) => Promise<boolean>;
  registerNewUser: (email: string, fullName?: string, role?: UserRole, password?: string) => Promise<Profile>;
  signOut: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  updateUserRole: (targetUserId: string, newRole: UserRole) => Promise<boolean>;
  updateProfile: (updatedData: Partial<Profile>) => Promise<boolean>;
  isLiveSupabase: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_USER = 'antigravity_active_user_id';
const LOCAL_STORAGE_KEY_PROFILES = 'antigravity_profiles_cache';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>(MOCK_PROFILES);
  const [currentUser, setCurrentUser] = useState<Profile | null>(MOCK_PROFILES[0]);
  const [isLiveSupabase] = useState(false);

  // Initialize from localStorage or fallback
  useEffect(() => {
    try {
      const savedProfiles = localStorage.getItem(LOCAL_STORAGE_KEY_PROFILES);
      if (savedProfiles) {
        setProfiles(JSON.parse(savedProfiles));
      }
      const savedUserId = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
      if (savedUserId) {
        if (savedUserId === 'guest_signed_out') {
          setCurrentUser(null);
        } else {
          const found = (savedProfiles ? JSON.parse(savedProfiles) : MOCK_PROFILES).find(
            (p: Profile) => p.id === savedUserId
          );
          if (found) {
            setCurrentUser(found);
          }
        }
      }
    } catch (e) {
      console.warn('LocalStorage not accessible', e);
    }
  }, []);

  const switchUser = (profileId: string) => {
    const found = profiles.find((p) => p.id === profileId);
    if (found) {
      setCurrentUser(found);
      try { localStorage.setItem(LOCAL_STORAGE_KEY_USER, found.id); } catch (e) {}
      showToast('Switched Persona', `Active user changed to ${found.full_name || found.email}`, 'info');
    }
  };

  const loginUser = async (email: string, _password?: string): Promise<boolean> => {
    const targetEmail = email.trim().toLowerCase();
    const existing = profiles.find((p) => p.email.toLowerCase() === targetEmail);

    if (existing) {
      setCurrentUser(existing);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_USER, existing.id);
      } catch (e) {}
      showToast('Welcome Back! 👋', `Successfully signed in as ${existing.full_name || existing.email}`, 'success');
      return true;
    }

    // Auto-create profile if logging in for demo
    const newProfile: Profile = {
      id: `user-${Date.now()}`,
      email: targetEmail,
      full_name: targetEmail.split('@')[0],
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetEmail)}`,
      role: 'user',
      created_at: new Date().toISOString(),
    };

    const updated = [...profiles, newProfile];
    setProfiles(updated);
    setCurrentUser(newProfile);

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PROFILES, JSON.stringify(updated));
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, newProfile.id);
    } catch (e) {}

    showToast('Account Initialized', `Signed in as ${newProfile.full_name}`, 'success');
    return true;
  };

  const registerNewUser = async (
    email: string,
    fullName?: string,
    role: UserRole = 'user',
    _password?: string
  ): Promise<Profile> => {
    const targetEmail = email.trim().toLowerCase();
    const existing = profiles.find((p) => p.email.toLowerCase() === targetEmail);
    if (existing) {
      setCurrentUser(existing);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_USER, existing.id);
      } catch (e) {}
      showToast('Account Exists', `Signed in as existing user ${existing.full_name || existing.email}`, 'info');
      return existing;
    }

    const newProfile: Profile = {
      id: `user-${Date.now()}`,
      email: targetEmail,
      full_name: fullName?.trim() || targetEmail.split('@')[0],
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(targetEmail)}`,
      role,
      created_at: new Date().toISOString(),
    };

    const updated = [...profiles, newProfile];
    setProfiles(updated);
    setCurrentUser(newProfile);

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PROFILES, JSON.stringify(updated));
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, newProfile.id);
    } catch (e) {}

    // Send Welcome Email Notification
    try {
      fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: newProfile.email,
          recipientName: newProfile.full_name || 'New Member',
          subject: '🎉 Welcome to Antigravity AI Scheduling System!',
          type: 'daily_digest',
          eventTitle: 'Account Verified & Notification Dispatch Active',
          eventDescription:
            'Your account is ready. You will automatically receive email notifications whenever team members invite you to meetings or your scheduled routines are due.',
          startTime: new Date().toISOString(),
          hostName: 'Antigravity AI System',
        }),
      }).catch(() => {});
    } catch (e) {}

    showToast('Account Registered! 🚀', `Registered as ${newProfile.full_name} (${newProfile.email})`, 'success');
    return newProfile;
  };

  const signOut = () => {
    setCurrentUser(null);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, 'guest_signed_out');
    } catch (e) {}
    showToast('Signed Out', 'You have been safely signed out.', 'info');
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    showToast(
      'Password Reset Dispatched 📧',
      `A password recovery link has been sent to ${email.trim()}. Check your inbox.`,
      'success'
    );
    return true;
  };

  const updateUserRole = async (targetUserId: string, newRole: UserRole): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'admin') {
      showToast('RLS Permission Denied', 'Only administrators can modify user roles.', 'error');
      return false;
    }

    const updated = profiles.map((p) => (p.id === targetUserId ? { ...p, role: newRole } : p));
    setProfiles(updated);
    if (currentUser.id === targetUserId) {
      setCurrentUser({ ...currentUser, role: newRole });
    }

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PROFILES, JSON.stringify(updated));
    } catch (e) {}

    showToast('User Role Updated', `Role updated to ${newRole} for user successfully.`, 'success');
    return true;
  };

  const updateProfile = async (updatedData: Partial<Profile>): Promise<boolean> => {
    if (!currentUser) return false;
    const updated = profiles.map((p) =>
      p.id === currentUser.id ? { ...p, ...updatedData } : p
    );
    setProfiles(updated);
    const updatedSelf = { ...currentUser, ...updatedData };
    setCurrentUser(updatedSelf);

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PROFILES, JSON.stringify(updated));
    } catch (e) {}

    showToast('Profile Updated', 'Your profile details have been saved.', 'success');
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allProfiles: profiles,
        isAdmin: currentUser?.role === 'admin',
        isAuthenticated: currentUser !== null,
        switchUser,
        loginUser,
        registerNewUser,
        signOut,
        resetPassword,
        updateUserRole,
        updateProfile,
        isLiveSupabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
