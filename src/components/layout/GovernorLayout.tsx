import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from '../common/NotificationBell';
import LanguageToggle from '../common/LanguageToggle';
import AnnouncementBanner from '../common/AnnouncementBanner';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { 
  Menu, 
  X, 
  LogOut, 
  User,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface GovernorLayoutProps {
  children: ReactNode;
  title: string;
}

interface NavItem {
  text: string;
  path: string;
  hasDropdown?: boolean;
  dropdownItems?: { text: string; path: string }[];
}

const GovernorLayout = ({ children, title }: GovernorLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const { announcements } = useAnnouncements('governor');
  const navigate = useNavigate();
  const location = useLocation();

  // Governor navigation items with dropdowns
  const getNavItems = (): NavItem[] => {
    return [
      { text: 'DASHBOARD', path: '/governor' },
      { 
        text: 'ACCOUNTS', 
        path: '/governor/investors',
        hasDropdown: true,
        dropdownItems: [
          { text: 'All Accounts', path: '/governor/investors' },
          { text: 'Account Management', path: '/governor/account-management' },
          { text: 'Deletion Approvals', path: '/governor/deletion-approvals' }
        ]
      },
      { 
        text: 'OPERATIONS', 
        path: '/governor/withdrawals',
        hasDropdown: true,
        dropdownItems: [
          { text: 'Withdrawal Control', path: '/governor/withdrawals' },
          { text: 'Security Monitor', path: '/governor/security' },
          { text: 'System Logs', path: '/governor/logs' }
        ]
      },
      { text: 'MESSAGES', path: '/governor/messages' },
      { text: 'CONFIGURATION', path: '/governor/config' }
    ];
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActivePath = (path: string) => {
    if (path === '/governor' && location.pathname === '/governor') {
      return true;
    }
    return location.pathname.startsWith(path) && path !== '/governor';
  };

  const handleDropdownToggle = (itemText: string) => {
    setActiveDropdown(activeDropdown === itemText ? null : itemText);
  };

  const handleNavItemClick = (item: NavItem) => {
    if (item.hasDropdown) {
      handleDropdownToggle(item.text);
    } else {
      navigate(item.path);
      setActiveDropdown(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation Bar - Matching Admin Style */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between min-h-[48px]">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4 flex-shrink-0">
              <img 
                src="/Screenshot 2025-06-07 024813.png" 
                alt="Interactive Brokers" 
                className="h-6 w-auto object-contain"
              />
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="font-medium whitespace-nowrap">PortfolioAnalyst</span>
                <span className="px-2 py-1 bg-black text-white text-xs font-medium whitespace-nowrap">GOVERNOR</span>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="hidden lg:flex items-center space-x-6 relative flex-1 justify-center">
              {navItems.map((item, index) => (
                <div key={index} className="relative">
                  <button
                    onClick={() => handleNavItemClick(item)}
                    className={`flex items-center space-x-1 text-sm font-medium transition-colors py-3 px-2 ${
                      isActivePath(item.path)
                        ? 'text-black border-b-2 border-black'
                        : 'text-gray-700 hover:text-black'
                    }`}
                  >
                    <span className="whitespace-nowrap">{item.text}</span>
                    {item.hasDropdown && (
                      <span className={`ml-1 transition-transform ${
                        activeDropdown === item.text ? 'rotate-180' : ''
                      }`}>▼</span>
                    )}
                  </button>
                  
                  {/* Dropdown Menu */}
                  {item.hasDropdown && activeDropdown === item.text && (
                     <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-black shadow-lg z-50">
                      <div className="py-2">
                        {item.dropdownItems?.map((dropdownItem, dropdownIndex) => (
                          <button
                            key={dropdownIndex}
                            onClick={() => {
                              navigate(dropdownItem.path);
                              setActiveDropdown(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-black transition-colors"
                          >
                            {dropdownItem.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right Side - User Menu */}
            <div className="flex items-center space-x-4 flex-shrink-0">
              {/* Notification Bell */}
              <NotificationBell />
              
              {/* Language Toggle */}
              <LanguageToggle />
              
              {/* User Menu */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-black transition-colors whitespace-nowrap"
              >
                <span className="hidden md:inline font-medium">{user?.name}</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <span className="text-xl">☰</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed inset-y-0 left-0 z-30 w-72 bg-white shadow-xl lg:hidden border-r border-gray-100"
            >
              <div className="p-6 flex justify-between items-center border-b border-gray-100">
                <div className="flex items-center">
                  <img 
                    src="/Screenshot 2025-06-07 024813.png" 
                    alt="Interactive Brokers" 
                    className="h-8 w-auto object-contain"
                  />
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>

              <div className="py-6">
                {/* Navigation Items */}
                {navItems.map((item, index) => (
                  <div key={index}>
                    <button
                      onClick={() => {
                        if (item.hasDropdown) {
                          handleDropdownToggle(item.text);
                        } else {
                          navigate(item.path);
                          setSidebarOpen(false);
                        }
                      }}
                      className={`flex items-center justify-between w-full px-6 py-3 text-left transition-colors ${
                        isActivePath(item.path)
                          ? 'bg-gray-100 text-black border-r-2 border-black'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-black'
                      }`}
                    >
                      <span className="font-medium">{item.text}</span>
                      {item.hasDropdown && (
                        <span className={`transition-transform ${
                          activeDropdown === item.text ? 'rotate-180' : ''
                        }`}>▼</span>
                      )}
                    </button>
                    
                    {/* Mobile Dropdown */}
                    {item.hasDropdown && activeDropdown === item.text && (
                      <div className="bg-gray-100 border-l-2 border-black">
                        {item.dropdownItems?.map((dropdownItem, dropdownIndex) => (
                          <button
                            key={dropdownIndex}
                            onClick={() => {
                              navigate(dropdownItem.path);
                              setSidebarOpen(false);
                              setActiveDropdown(null);
                            }}
                            className="w-full text-left px-12 py-2 text-sm text-gray-600 hover:bg-gray-200 hover:text-black transition-colors"
                          >
                            {dropdownItem.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="px-6 py-3 mt-6 border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-gray-600 hover:text-black transition-colors"
                  >
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="bg-white min-h-screen flex flex-col">
        {/* Announcement Banners */}
        {announcements.length > 0 && (
          <div className="p-6 pb-0">
            <AnnouncementBanner announcements={announcements} />
          </div>
        )}
        
        {/* Page Content */}
        <main className={`${announcements.length > 0 ? 'px-6 pb-6' : 'p-6'} flex-1 min-h-0`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default GovernorLayout;