'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Shield,
  Target,
  AlertTriangle,
  FileText,
  Search,
  Radio,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Assessments', href: '/assessments', icon: Shield },
  { name: 'Targets', href: '/targets', icon: Target },
  { name: 'Findings', href: '/findings', icon: AlertTriangle },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'OSINT', href: '/osint', icon: Search },
  { name: 'Prometheus', href: '/prometheus', icon: Radio },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout: authLogout, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      await authLogout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect even if logout API fails
      router.push('/login');
    }
  };

  // Get user initials for avatar
  const getUserInitials = (): string => {
    if (!user?.name) return 'U';
    const names = user.name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  // Get role display text
  const getRoleDisplay = (): string => {
    if (!user) return 'Guest';
    switch (user.role) {
      case 'admin':
        return 'Administrator';
      case 'analyst':
        return 'Security Analyst';
      case 'viewer':
        return 'Viewer';
      default:
        return user.role;
    }
  };

  // Get trust level display
  const getTrustLevelDisplay = (): string => {
    if (!user) return '';
    return `Authority ${user.trustLevel}`;
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-dark-200 border-r border-gray-700">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-700">
        <Shield className="h-8 w-8 text-primary-500" />
        <span className="ml-2 text-xl font-bold text-white">SHADOWGLASS</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-dark-100 hover:text-white'
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-700 p-4">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-dark-300" />
              <div className="ml-3 flex-1">
                <div className="h-4 bg-dark-300 rounded w-24 mb-2" />
                <div className="h-3 bg-dark-300 rounded w-16" />
              </div>
            </div>
          </div>
        ) : isAuthenticated && user ? (
          <div className="space-y-3">
            {/* User Info */}
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {getUserInitials()}
                </span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {getRoleDisplay()}
                </p>
              </div>
            </div>

            {/* Trust Level Badge */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-gray-500">
                {getTrustLevelDisplay()}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  user.trustLevel >= 9
                    ? 'bg-primary-600/20 text-primary-400'
                    : user.trustLevel >= 7
                    ? 'bg-green-600/20 text-green-400'
                    : 'bg-gray-600/20 text-gray-400'
                }`}
              >
                {user.trustLevel >= 9
                  ? 'Commander'
                  : user.trustLevel >= 7
                  ? 'Trusted'
                  : 'Standard'}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-dark-100 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center px-3 py-2 text-sm font-medium text-primary-400 hover:text-primary-300 hover:bg-dark-100 rounded-lg transition-colors"
          >
            <User className="h-4 w-4 mr-2" />
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}
