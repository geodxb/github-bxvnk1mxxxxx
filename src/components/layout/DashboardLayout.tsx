import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SupportChat from '../support/SupportChat';
import NotificationBell from '../common/NotificationBell';
import LanguageToggle from '../common/LanguageToggle';
import AnnouncementBanner from '../common/AnnouncementBanner';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { 
  Menu, 
  X, 
  LogOut, 
  User,
  ChevronDown,
  Users,
  DollarSign,
  MessageSquare,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { useAuth, UserRole } from '../../contexts/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

interface NavItem {
  text: string;
  path: string;
  hasDropdown?: boolean;
  dropdownItems?: { text: string; path: string }[];
}

const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [supportChatOpen, setSupportChatOpen] = useState(false);
  const { user, logout, setGlobalLoading } = useAuth();
  const { announcements } = useAnnouncements(user?.role || 'investor');
  const navigate = useNavigate();
  const location = useLocation();

  // Show loading on navigation
  const handleNavigation = (path: string) => {
    navigate(path);
    setActiveDropdown(null);
  };

  // Navigation items based on user role
  const getNavItems = (): NavItem[] => {
    if (user?.role === 'investor') {
      // Investors only see Dashboard and Messages
      return [
        { text: 'Dashboard', path: '/investor' },
        { text: 'Messages', path: '/investor/messages' }
      ];
    }
    
    // Admin navigation (full access)
    return [
      { text: 'Dashboard', path: '/admin' },
      { text: 'Messages', path: '/admin/messages' },
      { 
        text: 'Holdings', 
        path: '/admin/investors',
        hasDropdown: true,
        dropdownItems: [
          { text: 'Investor Holdings', path: '/admin/investors' },
          { text: 'Active Accounts', path: '/admin/investors?status=active' },
          { text: 'Restricted', path: '/admin/investors?status=restricted' }
        ]
      },
      { text: 'Reports', path: '/admin/analytics' },
      { 
        text: 'Planning', 
        path: '/admin/withdrawals',
        hasDropdown: true,
        dropdownItems: [
          { text: 'Withdrawal Management', path: '/admin/withdrawals' },
          { text: 'Commission Tracking', path: '/admin/commissions' },
          { text: 'Transaction History', path: '/admin/transactions' }
        ]
      },
      { 
        text: 'Profile', 
        path: '/admin/settings',
        hasDropdown: true,
        dropdownItems: [
          { text: 'Settings', path: '/admin/settings' },
          { text: 'Performance & Reports', path: '/admin/performance-reports' }
        ]
      },
    ];
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActivePath = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') {
      return true;
    }
    return location.pathname.startsWith(path) && path !== '/admin';
  };

  const handleDropdownToggle = (itemText: string) => {
    setActiveDropdown(activeDropdown === itemText ? null : itemText);
  };

  const handleNavItemClick = (item: NavItem) => {
    if (item.hasDropdown) {
      handleDropdownToggle(item.text);
    } else {
      handleNavigation(item.path);
      setActiveDropdown(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between min-h-[48px] lg:min-h-[48px]">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
              <img 
                src="/Screenshot 2025-06-07 024813.png" 
                alt="Interactive Brokers" 
                className="h-5 lg:h-6 w-auto object-contain"
                style={{ filter: 'none', boxShadow: 'none' }}
              />
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <span className="font-medium whitespace-nowrap text-xs lg:text-sm">PortfolioAnalyst</span>
                <span className="px-1 lg:px-2 py-1 bg-gray-800 text-white text-xs rounded font-medium whitespace-nowrap">MARKETS</span>
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
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                  >
                    <span className="whitespace-nowrap">{item.text}</span>
                    {item.hasDropdown && (
                      <ChevronDown 
                        size={14} 
                        className={`transition-transform ml-1 ${
                          activeDropdown === item.text ? 'rotate-180' : ''
                        }`} 
                      />
                    )}
                  </button>
                  
                  {/* Dropdown Menu */}
                  {item.hasDropdown && activeDropdown === item.text && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="py-2">
                        {item.dropdownItems?.map((dropdownItem, dropdownIndex) => (
                          <button
                            key={dropdownIndex}
                            onClick={() => {
                              handleNavigation(dropdownItem.path);
                              setActiveDropdown(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
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
           <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-shrink-0">
              {/* Notification Bell */}
              <NotificationBell />
              
              {/* Language Toggle */}
             <div className="hidden md:block">
               <LanguageToggle />
             </div>
              
              {/* Support Chat Button - Only show for admin users */}
              {user?.role === 'admin' && (
               <div className="hidden lg:block">
                 <button
                   onClick={() => setSupportChatOpen(true)}
                   className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors whitespace-nowrap"
                 >
                   <span className="hidden lg:inline font-medium">Support</span>
                 </button>
               </div>
              )}

              {/* User Menu */}
              <button
                onClick={handleLogout}
               className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
               <span className="hidden sm:inline font-medium text-xs lg:text-sm truncate max-w-16 lg:max-w-none">{user?.name}</span>
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
                  <X size={20} />
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
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                      }`}
                    >
                      <span className="font-medium">{item.text}</span>
                      {item.hasDropdown && (
                        <ChevronDown 
                          size={14} 
                          className={`transition-transform ${
                            activeDropdown === item.text ? 'rotate-180' : ''
                          }`} 
                        />
                      )}
                    </button>
                    
                    {/* Mobile Dropdown */}
                    {item.hasDropdown && activeDropdown === item.text && (
                      <div className="bg-gray-50 border-l-2 border-blue-200">
                        {item.dropdownItems?.map((dropdownItem, dropdownIndex) => (
                          <button
                            key={dropdownIndex}
                            onClick={() => {
                              handleNavigation(dropdownItem.path);
                              setSidebarOpen(false);
                              setActiveDropdown(null);
                            }}
                            className="w-full text-left px-12 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                          >
                            {dropdownItem.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="px-6 py-3 mt-6 border-t border-gray-100">
                  {/* Support Chat - Only show for admin users */}
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => {
                        setSidebarOpen(false);
                      }}
                      className="flex items-center w-full text-gray-600 hover:text-blue-600 transition-colors mb-3"
                    >
                      <span className="font-medium">Support Chat</span>
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation - Only show on mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 4).map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center space-y-1 px-2 py-2 text-xs transition-colors ${
                isActivePath(item.path)
                  ? 'text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              {/* Icons for each nav item */}
              <span className="font-medium truncate max-w-12">{item.text}</span>
            </button>
          ))}
          
          {/* More button for additional items */}
          {navItems.length > 4 && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center space-y-1 px-2 py-2 text-xs text-gray-600"
            >
              <span className="font-medium">More</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gray-50 min-h-screen flex flex-col pb-16 lg:pb-0">
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

      {/* Support Chat */}
      {user?.role === 'admin' && (
        <SupportChat 
          isOpen={supportChatOpen} 
          onClose={() => setSupportChatOpen(false)} 
        />
      )}
    </div>
  );
};

export default DashboardLayout;