'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useSchedule } from '@/context/schedule-context';
import { useToast } from '@/context/toast-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Settings,
  User,
  Palette,
  Database,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';
import Image from 'next/image';

const COLOR_SWATCHES = [
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#F59E0B', // Amber
];

export default function SettingsPage() {
  const { currentUser, updateProfile } = useAuth();
  const { categories, createCategory, updateCategory, deleteCategory } = useSchedule();
  const { showToast } = useToast();

  // Profile form
  const [fullName, setFullName] = useState(currentUser.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url || '');

  // Category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366F1');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatColor, setEditingCatColor] = useState('#6366F1');

  // Copy state
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      full_name: fullName.trim() || null,
      avatar_url: avatarUrl.trim() || null,
    });
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await createCategory(newCatName.trim(), newCatColor);
    setNewCatName('');
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editingCatName.trim()) return;
    await updateCategory(id, editingCatName.trim(), editingCatColor);
    setEditingCatId(null);
  };

  const sqlSchemaSnippet = `-- Run in Supabase SQL Editor:
create extension if not exists "uuid-ossp";
create type user_role as enum ('admin', 'user');
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  role user_role default 'user'::user_role not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- (See supabase/schema.sql for full schema)`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchemaSnippet);
    setCopiedSql(true);
    showToast('SQL Copied', 'Copied Supabase SQL migration snippet to clipboard.', 'info');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" /> Preferences & Customization
        </div>
        <h1 className="text-2xl font-black text-white">Profile, Categories & Supabase</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your persona avatar, color-coded categorization tags, and database connectivity.
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-400" />
          Personal Profile
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-indigo-500/40 flex-shrink-0">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
              ) : (
                <User className="w-8 h-8 text-slate-500 m-4" />
              )}
            </div>
            <div className="flex-1">
              <Input
                label="Avatar URL (Unsplash or image link)"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Alex Vance"
              required
            />
            <Input
              label="Email Address"
              value={currentUser.email}
              disabled
              helper="Email is bound to auth.users in Supabase"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary">
              Save Profile
            </Button>
          </div>
        </form>
      </div>

      {/* Category Management Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Palette className="w-4 h-4 text-indigo-400" />
          Schedule & Habit Categories
        </h2>
        <p className="text-xs text-slate-400">
          Categories define visual accents and organize your recurring schedules on the calendar.
        </p>

        {/* Create new category */}
        <form
          onSubmit={handleCreateCategory}
          className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3"
        >
          <div className="text-xs font-bold text-slate-200">Create New Category</div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Category name (e.g., Deep Focus, Client Sync)"
              className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />

            {/* Swatches */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {COLOR_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewCatColor(color)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    newCatColor === color ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <Button type="submit" size="sm" variant="primary">
              <Plus className="w-3.5 h-3.5" /> Add Category
            </Button>
          </div>
        </form>

        {/* Existing Categories List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((cat) => {
            const isEditing = editingCatId === cat.id;

            if (isEditing) {
              return (
                <div
                  key={cat.id}
                  className="p-3 bg-slate-950/80 border border-indigo-500/40 rounded-xl space-y-2"
                >
                  <input
                    type="text"
                    value={editingCatName}
                    onChange={(e) => setEditingCatName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {COLOR_SWATCHES.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditingCatColor(c)}
                          className={`w-4 h-4 rounded-full ${
                            editingCatColor === c ? 'ring-2 ring-white scale-110' : 'opacity-70'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingCatId(null)}
                        className="text-xs text-slate-400 hover:text-white px-2 py-1"
                      >
                        Cancel
                      </button>
                      <Button size="sm" onClick={() => handleUpdateCategory(cat.id)}>
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs font-bold text-slate-200">{cat.name}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCatId(cat.id);
                      setEditingCatName(cat.name);
                      setEditingCatColor(cat.color);
                    }}
                    className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCategory(cat.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Supabase PostgreSQL Configuration */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            Supabase Configuration & SQL Migration
          </h2>
          <Button size="sm" variant="secondary" onClick={handleCopySql}>
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSql ? 'Copied' : 'Copy SQL'}
          </Button>
        </div>
        <p className="text-xs text-slate-400">
          The database schema file is saved at <code className="text-indigo-400 font-mono">supabase/schema.sql</code>.
          To connect your live instance, supply your credentials in <code className="text-indigo-400 font-mono">.env.local</code>.
        </p>

        <pre className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-[11px] font-mono text-emerald-400/90 overflow-x-auto custom-scrollbar">
          {sqlSchemaSnippet}
        </pre>
      </div>
    </div>
  );
}
