import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LoadingScreen from '../../components/common/LoadingScreen';

interface PinEntryScreenProps {
  onAuthenticated: (targetPath?: string) => void;
}

const PinEntryScreen = ({ onAuthenticated }: PinEntryScreenProps) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [ipAccessDenied, setIpAccessDenied] = useState(false);
  const [clientIP, setClientIP] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([
    'Interactive Brokers Security Terminal v2.1.0',
    'Copyright (c) 2025 Interactive Brokers LLC',
    'All rights reserved.',
    '',
    'System initialized...',
    'Security protocols active...',
    'Awaiting authentication...',
    ''
  ]);
  
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // Check for IP access denial on component mount
  useEffect(() => {
    // Check if IP access was denied by the server
    if (typeof window !== 'undefined' && (window as any).ipAccessDenied) {
      const denialInfo = (window as any).ipAccessDenied;
      setIpAccessDenied(true);
      setClientIP(denialInfo.ip);
      
      // Clear existing command history and show access denied
      setCommandHistory([
        'Interactive Brokers Security Terminal v2.1.0',
        'Copyright (c) 2025 Interactive Brokers LLC',
        'All rights reserved.',
        '',
        '[SECURITY] Initializing IP verification...',
        '[FIREWALL] Checking client IP address...',
        `[FIREWALL] Client IP: ${denialInfo.ip}`,
        '[FIREWALL] Consulting IP whitelist database...',
        '[FIREWALL] SELECT * FROM authorized_ips WHERE ip_address = ?',
        '[FIREWALL] Query returned 0 rows',
        '[SECURITY] IP verification FAILED',
        '[AUDIT] Logging unauthorized access attempt...',
        `[AUDIT] Event: UNAUTHORIZED_ACCESS, IP: ${denialInfo.ip}, Time: ${new Date().toISOString()}`,
        '[INTRUSION] Potential security breach detected',
        '[RESPONSE] Activating access denial protocol...',
        '',
        '████████████████████████████████████████████████████████████',
        '█                    ACCESS DENIED                         █',
        '████████████████████████████████████████████████████████████',
        '',
        `C:\\> Access Denied`,
        `Your IP (${denialInfo.ip}) is not authorized to access this system.`,
        'Please contact the administrator.',
        '',
        '[SECURITY] Connection terminated by firewall',
        '[SYSTEM] Session blocked - unauthorized IP detected',
        `[LOG] Incident ID: INC${Date.now().toString(36).toUpperCase()}`,
        '',
        'System access restricted.',
        ''
      ]);
      
      return;
    }
  }, []);
  
  useEffect(() => {
    // Focus input on mount
    if (inputRef.current && !ipAccessDenied) {
      inputRef.current.focus();
    }
  }, [ipAccessDenied]);
  
  useEffect(() => {
    // Auto-scroll to bottom when command history updates
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandHistory]);
  
  const addToHistory = (text: string) => {
    setCommandHistory(prev => [...prev, text]);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if IP is denied
    if (ipAccessDenied) {
      addToHistory('> ' + input);
      addToHistory('ERROR: Access denied - IP not authorized');
      addToHistory('Connection terminated by security system');
      setInput('');
      return;
    }
    
    if (isBlocked) {
      addToHistory('> ' + input);
      addToHistory('ERROR: Access temporarily blocked. Please wait...');
      setInput('');
      return;
    }
    
    addToHistory('> ' + input);
    
    if (input.trim() === 'crisdoraodxb') {
      // Start the processing sequence
      await startProcessingSequence('admin');
    } else if (input.trim() === 'allow-affiliate') {
      // Start the processing sequence
      await startProcessingSequence('affiliate');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      addToHistory('ERROR: Invalid authentication code');
      addToHistory(`Failed attempts: ${newAttempts}/3`);
      
      if (newAttempts >= 3) {
        addToHistory('WARNING: Maximum attempts exceeded');
        addToHistory('Access temporarily blocked for security');
        setIsBlocked(true);
        
        // Unblock after 30 seconds
        setTimeout(() => {
          setIsBlocked(false);
          setAttempts(0);
          addToHistory('');
          addToHistory('Security timeout expired. Access restored.');
          addToHistory('Enter authentication code:');
        }, 30000);
      } else {
        addToHistory('Enter authentication code:');
      }
    }
    
    setInput('');
  };
  
  const startProcessingSequence = async (userType: 'admin' | 'affiliate') => {
    const processingMessages = [
      'Authentication successful...',
      '[AUTH] Decrypting access token... 0x7F4A2B1C',
      '[AUTH] RSA-2048 key validation... PASSED',
      'Validating access code...',
      '[SEC] Running SHA-256 hash verification...',
      '[SEC] Hash: a7f5f35426b927411fc9231b56382173eacdc...',
      'Code validation complete.',
      '[SYS] Initializing secure memory allocation...',
      '[SYS] malloc(4096) -> 0x7fff5fbff000',
      '',
      'Initializing security protocols...',
      '[NET] Establishing TLS 1.3 handshake...',
      '[NET] Cipher: AES-256-GCM, ECDHE-RSA-AES256-GCM-SHA384',
      '[SEC] Certificate chain validation... OK',
      'Loading user profiles...',
      '[DB] SELECT * FROM users WHERE auth_token=? LIMIT 1',
      '[DB] Query executed in 0.023ms',
      '[CACHE] Loading user permissions from Redis...',
      'Loading system data...',
      '[API] GET /api/v2/system/config HTTP/1.1',
      '[API] Response: 200 OK (Content-Length: 2847)',
      '[JSON] Parsing configuration data...',
      'Loading server configuration...',
      '[CFG] Reading /etc/ibkr/server.conf',
      '[CFG] Loaded 47 configuration parameters',
      '[ENV] NODE_ENV=production, PORT=443',
      '',
      'Accessing Interactive Brokers server...',
      '[TCP] Opening socket connection to ibkr-prod-01.aws.com:443',
      '[TCP] Connection established (RTT: 12ms)',
      '[SSL] Negotiating SSL/TLS connection...',
      'Establishing secure connection...',
      '[CERT] Verifying server certificate...',
      '[CERT] CN=*.interactivebrokers.com, Valid until: 2025-12-31',
      '[HANDSHAKE] Client Hello -> Server Hello -> Certificate',
      'Authorizing IP address...',
      '[FIREWALL] Checking IP whitelist: ' + (Math.floor(Math.random() * 255) + 1) + '.' + 
        (Math.floor(Math.random() * 255) + 1) + '.' + 
        (Math.floor(Math.random() * 255) + 1) + '.' + 
        (Math.floor(Math.random() * 255) + 1),
      '[GEO] Location verified: ' + (userType === 'admin' ? 'Dubai, AE' : 'Unknown'),
      '[RATE_LIMIT] Checking request limits... PASSED',
      'IP authorization complete.',
      '[SESSION] Generating session token...',
      '[SESSION] Token: sess_' + Math.random().toString(36).substr(2, 16),
      '',
      'Verifying user permissions...',
      '[RBAC] Loading role-based access control...',
      '[RBAC] User role: ' + (userType === 'admin' ? 'ADMINISTRATOR' : 'AFFILIATE'),
      '[PERMS] Checking permissions matrix...',
      'Loading account data...',
      '[DB] EXEC sp_GetUserAccounts @userId=?, @includeRestricted=1',
      '[DB] Returned 1 row(s) in 0.045ms',
      '[CACHE] Caching user data (TTL: 3600s)',
      'Synchronizing with database...',
      '[SYNC] Connecting to primary database cluster...',
      '[SYNC] Master: ibkr-db-master-01 (Status: ONLINE)',
      '[SYNC] Replica: ibkr-db-replica-02 (Lag: 0.001s)',
      '[REDIS] Updating session store...',
      '',
      'Security check passed.',
      '[AUDIT] Logging authentication event...',
      '[AUDIT] Event ID: ' + Date.now().toString(36).toUpperCase(),
      '[MONITOR] Updating security metrics...',
      'Session initialized successfully.',
      '[JWT] Signing access token with RS256...',
      '[JWT] Token expires: ' + new Date(Date.now() + 3600000).toISOString(),
      '',
      userType === 'admin' ? 'Redirecting to admin portal...' : 'Redirecting to affiliate portal...',
      '[ROUTE] Preparing redirect to /' + (userType === 'admin' ? 'login' : 'affiliate-login'),
      '[CLEANUP] Clearing temporary variables...',
      '[SECURITY] Enabling session monitoring...',
      'Access granted.'
    ];
    
    // Add each message with a delay to simulate processing
    for (let i = 0; i < processingMessages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100)); // 50-150ms delay
      addToHistory(processingMessages[i]);
    }
    
    // Store PIN authentication in sessionStorage
    sessionStorage.setItem('pin_authenticated', 'true');
    
    if (userType === 'affiliate') {
      sessionStorage.setItem('login_redirect_path', '/affiliate-login');
    }
    
    setIsLoading(true);
    
    // Final delay before redirect
    setTimeout(() => {
      if (userType === 'admin') {
        onAuthenticated('/login');
      } else {
        window.location.href = '/affiliate-login';
      }
    }, 500);
  };
  
  if (isLoading) {
    return <LoadingScreen message="Initializing secure session..." />;
  }
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      
      <div className="w-full max-w-4xl relative z-10">
        {/* Windows 95 Style Window */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-2 sm:mx-0 bg-white border-2"
          style={{
            borderTopColor: '#ffffff',
            borderLeftColor: '#ffffff',
            borderRightColor: '#808080',
            borderBottomColor: '#808080',
            boxShadow: '4px 4px 8px rgba(0,0,0,0.3)'
          }}
        >
          {/* Windows 95 Title Bar */}
          <div 
            className="px-2 py-1 flex items-center text-black text-sm font-bold"
            style={{
              background: '#ffffff'
            }}
          >
            <div className="flex items-center space-x-2 w-full justify-center">
              <div className="w-4 h-4 bg-white border border-black flex items-center justify-center">
                <span className="text-black text-xs font-bold">IB</span>
              </div>
              <span>Interactive Brokers Security Terminal</span>
            </div>
          </div>
          
          {/* Terminal Content Area */}
          <div className="p-4 bg-white relative">
            {/* Background logo overlay - 50% opacity */}
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ zIndex: 1 }}
            >
              <img 
                src="/Screenshot 2025-06-07 024813.png" 
                alt="Interactive Brokers" 
                className="h-4 sm:h-6 w-auto object-contain"
                style={{ opacity: 0.5 }}
              />
            </div>
            
            {/* Terminal screen */}
            <div 
              ref={terminalRef}
              className="relative h-64 sm:h-96 overflow-y-auto font-mono text-xs sm:text-sm p-3 bg-white border-2"
              style={{
                borderTopColor: '#808080',
                borderLeftColor: '#808080',
                borderRightColor: '#ffffff',
                borderBottomColor: '#ffffff',
                zIndex: 2
              }}
            >
              {/* Static Interactive Brokers Logo Background - Fixed to terminal viewport */}
              <div 
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ zIndex: 1 }}
              >
                <img 
                  src="/Screenshot 2025-06-07 024813.png" 
                  alt="Interactive Brokers" 
                  className="h-6 sm:h-8 w-auto object-contain"
                  style={{ opacity: 0.5 }}
                />
              </div>
              
              {/* Terminal content */}
              <div className="relative z-10">
                {commandHistory.map((line, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1, delay: index * 0.02 }}
                    className="whitespace-pre-wrap leading-tight text-black"
                    style={{
                      fontFamily: 'Courier New, monospace'
                    }}
                  >
                    {line}
                  </motion.div>
                ))}
                
                {/* Current Input Line */}
                {!ipAccessDenied && (
                  <form onSubmit={handleSubmit} className={`flex items-center mt-2 ${isBlocked ? 'opacity-50' : ''}`}>
                    <span 
                      className="mr-2 text-black"
                      style={{
                        fontFamily: 'Courier New, monospace'
                      }}
                    >
                      {"C:\\>"}
                    </span>
                    <input
                      ref={inputRef}
                      type="password"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none font-mono text-xs sm:text-sm text-black"
                      placeholder={isBlocked ? 'ACCESS BLOCKED...' : 'Enter authentication code'}
                      disabled={isBlocked}
                      autoComplete="off"
                      spellCheck={false}
                      style={{ 
                        fontFamily: 'Courier New, monospace',
                        caretColor: '#000000'
                      }}
                    />
                    {/* Blinking cursor */}
                    <span 
                      className="ml-1 animate-pulse text-black"
                      style={{ fontFamily: 'Courier New, monospace' }}
                    >
                      _
                    </span>
                  </form>
                )}
              </div>
            </div>
          </div>
          
          {/* Windows 95 Status Bar */}
          <div 
            className="px-2 py-1 bg-white border-t text-xs flex items-center justify-between"
            style={{
              borderTopColor: '#ffffff'
            }}
          >
            <div className="flex items-center space-x-4">
              <div 
                className="px-2 py-1 border bg-white"
                style={{
                  borderTopColor: '#808080',
                  borderLeftColor: '#808080',
                  borderRightColor: '#ffffff',
                  borderBottomColor: '#ffffff'
                }}
              >
                <span className="text-black">
                  {ipAccessDenied ? 'ACCESS DENIED' : isBlocked ? 'BLOCKED' : 'READY'}
                </span>
              </div>
              <span className="text-black">
                {ipAccessDenied ? `IP: ${clientIP}` : 'Secure Terminal Active'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 border"
                style={{
                  borderTopColor: '#808080',
                  borderLeftColor: '#808080',
                  borderRightColor: '#ffffff',
                  borderBottomColor: '#ffffff',
                  backgroundColor: ipAccessDenied ? '#000000' : '#000000'
                }}
              />
              <span className="text-black text-xs">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </motion.div>
        
        {/* Windows 95 Style Footer */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center mt-6 sm:mt-8"
        >
          <div 
            className="inline-block px-4 py-2 bg-white border-2 text-black text-xs"
            style={{
              borderTopColor: '#ffffff',
              borderLeftColor: '#ffffff',
              borderRightColor: '#808080',
              borderBottomColor: '#808080',
              boxShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            {ipAccessDenied ? (
              <div className="space-y-1">
                <div className="font-bold">Interactive Brokers LLC | Security System</div>
                <div className="text-black font-bold">UNAUTHORIZED ACCESS BLOCKED</div>
              </div>
            ) : (
              <div>Interactive Brokers LLC | All Rights Reserved</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PinEntryScreen;
