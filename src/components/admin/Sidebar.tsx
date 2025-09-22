import {
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign,
  Settings,
  LogOut
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Investors', href: '/admin/investors', icon: Users },
  { name: 'Withdrawals', href: '/admin/withdrawals', icon: CreditCard },
  { name: 'Commissions', href: '/admin/commissions', icon: DollarSign },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];