import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types/user';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import LoadingScreen from '../components/common/LoadingScreen';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  showGlobalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showGlobalLoading, setShowGlobalLoading] = useState<boolean>(false);
  const [globalLoadingStartTime, setGlobalLoadingStartTime] = useState<number>(0);

  // Global loading with minimum 2-second display
  const setGlobalLoading = (loading: boolean) => {
    if (loading) {
      setGlobalLoadingStartTime(Date.now());
      setShowGlobalLoading(true);
    } else {
      const elapsed = Date.now() - globalLoadingStartTime;
      const remainingTime = Math.max(0, 2000 - elapsed);
      
      setTimeout(() => {
        setShowGlobalLoading(false);
      }, remainingTime);
    }
  };

  // Auth state listener
  useEffect(() => {
    let isInitialLoad = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔄 Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out', 'Initial load:', isInitialLoad);
      
      if (firebaseUser) {
        console.log('✅ Firebase user authenticated, fetching user data...', firebaseUser.email);
        
        // Only fetch user data if this is not a duplicate auth state change
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('✅ User document found, setting user data', userData.role);
            
            // Check for governor role
            const userRole = userData.role === 'governor' ? 'governor' : userData.role;
            
            // Only update user state if it's different to prevent unnecessary re-renders
            setUser(prevUser => {
              const newUser = {
                id: firebaseUser.uid,
                name: userData.name,
                email: userData.email,
                role: userRole,
                createdAt: userData.createdAt?.toDate() || new Date(),
                updatedAt: userData.updatedAt?.toDate() || new Date()
              };
              
              // Only update if user data has actually changed
              if (!prevUser || 
                  prevUser.id !== newUser.id || 
                  prevUser.email !== newUser.email || 
                  prevUser.role !== newUser.role) {
                console.log('✅ User state updated');
                return newUser;
              }
              
              return prevUser;
            });
          } else if (firebaseUser.email === 'crisdoraodxb@gmail.com') {
            // Auto-create admin user
            console.log('✅ Creating admin user');
            setUser({
              id: firebaseUser.uid,
              name: 'Cristian Rolando Dorao',
              email: firebaseUser.email,
              role: 'governor' as UserRole,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        } catch (firestoreError) {
          console.error('Firestore error, but keeping user authenticated:', firestoreError);
        }
      } else {
        console.log('User logged out or not authenticated');
        setUser(null);
      }
      
      // Only set loading to false on initial load
      if (isInitialLoad) {
        setIsLoading(false);
        isInitialLoad = false;
      }
    });

    return () => {
      console.log('🔄 Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Attempting login for:', email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful');
      
      // Small delay to ensure auth state is properly set
      await new Promise(resolve => setTimeout(resolve, 500));
      return true;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  // Show global loading screen only when explicitly triggered
  if (showGlobalLoading) {
    return <LoadingScreen message="Please wait..." />;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, showGlobalLoading, setGlobalLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Export UserRole for backward compatibility
export type { UserRole };