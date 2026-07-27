'use client';

import Image from 'next/image';
import { useId, useState } from 'react';

import { cn } from '@/shared/utils/cn';

import type { AuthRoleId } from '../types';
import { ForgotPasswordModal } from './forgot-password-modal';
import { LoginForm } from './login-form';
import { SignupForm } from './signup-form';

type AuthTab = 'login' | 'signup';

/**
 * Replaces `#authScreen` / `.auth-card`. Holds the tab and role state shared by
 * both forms — switching tabs keeps the selected role, matching the prototype.
 */
export function AuthCard() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [role, setRole] = useState<AuthRoleId>('executive_council');
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const loginPanelId = useId();
  const signupPanelId = useId();

  /**
   * The role is shared across both tabs, but login still offers Administrator while
   * signup does not (self-signup for that role was removed 2026-07-27). Without this,
   * picking Administrator on Log In and then switching to Sign Up would leave the
   * signup form on a role its own selector can't display and its payload builder
   * can't fill — a dead form with no visible selection. Fall back to the first role
   * signup does offer.
   */
  function openSignup() {
    if (role === 'admin') setRole('executive_council');
    setActiveTab('signup');
  }

  return (
    <div className="w-full max-w-[500px] overflow-hidden rounded-auth bg-surface shadow-overlay">
      <div className="bg-brand-gradient px-8 py-8 text-center text-white">
        <Image
          src="/logo.jpg"
          alt="Girl Scouts of the Philippines"
          width={70}
          height={70}
          className="mx-auto mb-4 rounded-full object-cover"
        />
        {/* The base h1/h2/h3/h4 rule in globals.css sets an explicit dark `color`,
            which wins over inheritance from this white-text header — set it back
            here rather than on every gradient header that ever needs a heading. */}
        <h1 className="text-[1.5rem] font-medium text-white">Girl Scouts of the Philippines</h1>
        <p className="mt-1 text-[0.85rem] text-white/85">Once a Girl Scout, Always a Girl Scout</p>
      </div>

      <div className="flex border-b-2 border-hairline-subtle" role="tablist" aria-label="Authentication">
        <button
          type="button"
          role="tab"
          id={`${loginPanelId}-tab`}
          aria-selected={activeTab === 'login'}
          aria-controls={loginPanelId}
          onClick={() => setActiveTab('login')}
          className={cn(
            '-mb-0.5 flex-1 border-b-[3px] py-3.5 text-center text-[0.95rem] font-semibold transition',
            activeTab === 'login'
              ? 'border-brand-green text-brand-green'
              : 'border-transparent text-muted hover:text-ink',
          )}
        >
          Log In
        </button>
        <button
          type="button"
          role="tab"
          id={`${signupPanelId}-tab`}
          aria-selected={activeTab === 'signup'}
          aria-controls={signupPanelId}
          onClick={openSignup}
          className={cn(
            '-mb-0.5 flex-1 border-b-[3px] py-3.5 text-center text-[0.95rem] font-semibold transition',
            activeTab === 'signup'
              ? 'border-brand-green text-brand-green'
              : 'border-transparent text-muted hover:text-ink',
          )}
        >
          Sign Up
        </button>
      </div>

      <div className="p-7">
        <div id={loginPanelId} role="tabpanel" aria-labelledby={`${loginPanelId}-tab`} hidden={activeTab !== 'login'}>
          {activeTab === 'login' ? (
            <LoginForm
              role={role}
              onRoleChange={setRole}
              onSwitchToSignup={openSignup}
              onForgotPassword={() => setIsForgotOpen(true)}
            />
          ) : null}
        </div>
        <div
          id={signupPanelId}
          role="tabpanel"
          aria-labelledby={`${signupPanelId}-tab`}
          hidden={activeTab !== 'signup'}
        >
          {activeTab === 'signup' ? (
            <SignupForm role={role} onRoleChange={setRole} onSwitchToLogin={() => setActiveTab('login')} />
          ) : null}
        </div>
      </div>

      <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} />
    </div>
  );
}
