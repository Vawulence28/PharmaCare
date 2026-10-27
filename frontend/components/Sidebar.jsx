'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LayoutDashboard, Pill, Layers, FileText, Users, ShieldCheck, X } from 'lucide-react';

const baseNavItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Drugs', href: '/drugs', icon: Pill },
  { name: 'Batches & Stock', href: '/stock', icon: Layers },
  { name: 'Reports', href: '/reports', icon: FileText },
];

export function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [...baseNavItems];
  if (user?.role === 'ADMIN') {
    navItems.push({ name: 'User Management', href: '/users', icon: Users });
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside className={`w-64 bg-navy-900 text-slate-300 flex flex-col h-screen fixed inset-y-0 left-0 z-50 shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-navy-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-600 p-2 rounded-lg text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base">PharmaCare</h1>
              <p className="text-xs text-slate-400">Inventory Management</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-navy-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-600 text-white shadow-md' : 'hover:bg-navy-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-navy-800 text-xs text-slate-400 text-center">
          Pharmacy Edition v1.0
        </div>
      </aside>
    </>
  );
}