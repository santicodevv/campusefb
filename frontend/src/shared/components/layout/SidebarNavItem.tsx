import { NavLink } from 'react-router-dom';
import { cn } from '@/shared/lib';
import { ChevronDown } from 'lucide-react';
import type { RoleCode } from '@/shared/types';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: RoleCode[];
  children?: NavItem[];
}

interface SidebarNavItemProps {
  item: NavItem;
  expandedMenus: Record<string, boolean>;
  onToggle: (href: string) => void;
  onClose: () => void;
  currentPath: string;
}

function isChildActive(item: NavItem, currentPath: string): boolean {
  if (!item.children) return false;
  return item.children.some(
    (child) => currentPath === child.href || currentPath.startsWith(child.href + '/'),
  );
}

export function SidebarNavItem({ item, expandedMenus, onToggle, onClose, currentPath }: SidebarNavItemProps) {
  if (item.children && item.children.length > 0) {
    const isExpanded = expandedMenus[item.href] || isChildActive(item, currentPath);
    const hasActiveChild = isChildActive(item, currentPath);

    return (
      <div key={item.href} className="mb-[1px]">
        <button
          onClick={() => onToggle(item.href)}
          aria-expanded={isExpanded}
          aria-controls={`sidebar-submenu-${item.href.replace(/\//g, '-')}`}
          className={cn(
            'group flex items-center justify-between gap-[10px] p-[8px_10px] rounded-lg text-[13.5px] font-medium text-gray-600 cursor-pointer transition-colors w-full text-left hover:bg-violet-50 hover:text-violet-700',
            hasActiveChild ? 'bg-violet-100 text-violet-700 font-semibold' : '',
          )}
        >
          <span className={cn("flex items-center justify-center w-[30px] h-[30px] rounded-[7px] transition-colors shrink-0", hasActiveChild ? 'bg-violet-200' : 'bg-transparent group-hover:bg-violet-200')}>
            <item.icon className="h-[18px] w-[18px]" />
          </span>
          <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
          <ChevronDown
            className={cn(
              'shrink-0 text-gray-400 h-4 w-4 transition-transform duration-200',
              isExpanded ? 'rotate-0' : '-rotate-90',
            )}
          />
        </button>

        <div
          id={`sidebar-submenu-${item.href.replace(/\//g, '-')}`}
          role="region"
          className={cn(
            'overflow-hidden transition-all duration-200',
            isExpanded ? 'max-h-[300px] opacity-100 mt-[2px] pb-[4px]' : 'max-h-0 opacity-0 pointer-events-none',
          )}
        >
          {item.children.map((child) => (
            <NavLink
              key={child.href}
              to={child.href}
              end
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-[8px] p-[7px_10px_7px_40px] rounded-[7px] text-[13px] font-medium transition-colors relative',
                  isActive ? 'bg-violet-100 text-violet-700 font-semibold' : 'text-gray-500 hover:bg-violet-50 hover:text-violet-600',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn("flex items-center justify-center w-[22px] h-[22px] rounded-[5px] shrink-0 transition-opacity", isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100')}>
                    <child.icon className="h-[15px] w-[15px]" />
                  </span>
                  <span className="flex-1">{child.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <NavLink
      key={item.href}
      to={item.href}
      end={item.href.split('/').length <= 2}
      onClick={onClose}
      className={({ isActive }) =>
        cn('group flex items-center gap-[10px] p-[8px_10px] rounded-lg text-[13.5px] font-medium transition-colors w-full relative', isActive ? 'bg-violet-100 text-violet-700 font-semibold' : 'text-gray-600 hover:bg-violet-50 hover:text-violet-700')
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn("flex items-center justify-center w-[30px] h-[30px] rounded-[7px] transition-colors shrink-0", isActive ? 'bg-violet-200' : 'bg-transparent group-hover:bg-violet-200')}>
            <item.icon className="h-[18px] w-[18px]" />
          </span>
          <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}
