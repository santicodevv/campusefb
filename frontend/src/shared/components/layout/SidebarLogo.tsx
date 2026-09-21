import { Link } from 'react-router-dom';
import { X } from 'lucide-react';

interface SidebarLogoProps {
  defaultRoute: string;
  onClose: () => void;
}

export function SidebarLogo({ defaultRoute, onClose }: SidebarLogoProps) {
  return (
    <div className="flex items-center justify-between h-[60px] px-5 border-b border-gray-100 shrink-0">
      <Link
        to={defaultRoute}
        onClick={onClose}
        className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
      >
        <img
          src="/logo_login.png"
          alt="EFB Logo"
          className="h-8 w-8 rounded-lg object-contain"
        />
        <span className="text-[15px] font-bold text-gray-900 tracking-tight">
          EFB
        </span>
      </Link>
      <button
        onClick={onClose}
        className="lg:hidden flex items-center justify-center h-7 w-7 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
