'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bell, UserCircle, LogOut, Menu } from 'lucide-react';
import { Button } from './ui/Button';

export function Header({ onOpenSidebar }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center space-x-3">
        <button 
          onClick={onOpenSidebar} 
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open Menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <span className="text-xs sm:text-sm font-medium text-slate-500">
          System Status: <span className="text-emerald-600 font-semibold">Online</span>
        </span>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-6">
        <div className="flex items-center space-x-3 border-l border-slate-200 pl-3 sm:pl-4">
          <UserCircle className="w-8 h-8 text-slate-700" />
          <div className="text-left hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">{user?.fullName || 'User'}</p>
            <p className="text-xs font-medium text-primary-600 uppercase">{user?.role || 'Guest'}</p>
          </div>
        </div>
        {user && (
          <Button variant="outline" onClick={logout} className="flex items-center space-x-1.5 text-xs py-1.5 px-2.5 sm:px-3">
            <LogOut className="w-4 h-4" />
            <span className="hidden xs:inline">Logout</span>
          </Button>
        )}
      </div>
    </header>
  );
}