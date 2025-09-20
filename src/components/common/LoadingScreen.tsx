import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  type?: 'loading' | 'maintenance';
  title?: string;
}

const LoadingScreen = ({ 
  message = "We're preparing your dashboard", 
  type = 'loading',
  title 
}: LoadingScreenProps) => {
  
  if (type === 'maintenance') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-gray-300 shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 border border-red-300 rounded-lg flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
            {title || 'SYSTEM MAINTENANCE'}
          </h1>
          <p className="text-gray-700 mb-6 uppercase tracking-wide text-sm font-medium">
            {message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors rounded-lg uppercase tracking-wide"
          >
            REFRESH PAGE
          </button>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center"
      >
        {/* Rotating Interactive Brokers Logo with Google-style spiral */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            rotate: [0, 360, 720]
          }}
          transition={{ 
            scale: { duration: 0.5 },
            opacity: { duration: 0.5 },
            rotate: { 
              duration: 3, 
              times: [0, 0.6, 1],
              ease: ["easeOut", "easeInOut", "easeOut"]
            }
          }}
          className="mb-16 relative"
        >
          {/* Google-style rotating spiral */}
          <motion.div
            className="absolute inset-0 w-20 h-20 rounded-full border-2 border-transparent border-t-red-500"
            animate={{
              rotate: [0, 360]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute inset-0 w-20 h-20 rounded-full border-2 border-transparent border-r-red-400"
            animate={{
              rotate: [0, 360]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
              delay: 0.25
            }}
          />
          <motion.div
            className="absolute inset-0 w-20 h-20 rounded-full border-2 border-transparent border-b-red-300"
            animate={{
              rotate: [0, 360]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
              delay: 0.5
            }}
          />
          
          <div className="bg-white rounded-full p-4 shadow-lg relative z-10 w-20 h-20 flex items-center justify-center">
            <img 
              src="/Screenshot 2025-06-07 024018 copy.png" 
              alt="Interactive Brokers" 
              className="h-12 w-auto object-contain opacity-80"
            />
          </div>
        </motion.div>
        
        {/* Interactive Brokers Logo Image */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <img 
            src="/Screenshot 2025-06-07 024813.png" 
            alt="Interactive Brokers" 
            className="h-8 w-auto object-contain mx-auto opacity-90"
          />
        </motion.div>
        
        {/* Loading Message */}
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-gray-700 font-medium text-center"
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;