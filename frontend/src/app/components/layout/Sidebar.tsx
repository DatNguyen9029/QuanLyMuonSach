import { Link, useLocation } from 'react-router';
import { 
  LayoutDashboard, 
  BookOpen, 
  BookCopy, 
  Users, 
  MessageCircle, 
  Settings,
  LogOut,
  Library
} from 'lucide-react';
import { cn } from '../ui/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Quản lý Sách', href: '/books', icon: BookOpen },
  { name: 'Quản lý Mượn/Trả', href: '/borrowing', icon: BookCopy },
  { name: 'Quản lý Độc giả', href: '/users', icon: Users },
  { name: 'Chat Hỗ trợ', href: '/chat', icon: MessageCircle },
  { name: 'Cài đặt', href: '/settings', icon: Settings },
];

interface SidebarProps {
  onLogout: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  const location = useLocation();

  return (
    <div className="flex h-screen w-64 flex-col bg-gradient-to-b from-blue-600 to-blue-700 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-blue-500 px-6">
        <Library className="h-8 w-8" />
        <div>
          <h1 className="font-bold text-xl">Happy Library</h1>
          <p className="text-xs text-blue-200">Admin Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all',
                isActive
                  ? 'bg-white text-blue-700 shadow-md'
                  : 'text-blue-100 hover:bg-blue-500/30'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="border-t border-blue-500 p-4">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-blue-100 transition-all hover:bg-blue-500/30"
        >
          <LogOut className="h-5 w-5" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}
