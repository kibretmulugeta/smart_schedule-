'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profile, UserRole } from '@/types/database.types';
import { MOCK_PROFILES } from '@/lib/mock-data';
import { useToast } from './toast-context';

interface AuthContextType {
  currentUser: Profile;
  allProfiles: Profile[];
  isAdmin: boolean;
  switchUser: (profileId: string) => void;
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
  const [currentUser, setCurrentUser] = useState<Profile>(MOCK_PROFILES[0]);
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
        const found = (savedProfiles ? JSON.parse(savedProfiles) : MOCK_PROFILES).find(
          (p: Profile) => p.id === savedUserId
        );
        if (found) {
          setCurrentUser(found);
        }
      }
    } catch (e) {
      console.warn('LocalStorage not accessible', e);
    }
  }, []);

  const switchUser = (profileId: string) => {
    const target = profiles.find((p) => p.id === profileId);
    if (target) {
      setCurrentUser(target);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_USER, target.id);
      } catch (e) {}
      showToast('Switched Persona', `Active profile is now ${target.full_name} (${target.role.toUpperCase()})`, 'info');
    }
  };

  const updateUserRole = async (targetUserId: string, newRole: UserRole): Promise<boolean> => {
    // Check RLS policy rule: Admins can update user roles
    if (currentUser.role !== 'admin') {
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
        isAdmin: currentUser.role === 'admin',
        switchUser,
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
