import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface UserData {
  username: string;
  isAdmin: boolean;
  companyName: string;
  category: 'A' | 'B' | 'C';
  address?: string;
  contactNumber?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, userData: Omit<UserData, 'isAdmin' | 'username'>) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // First try to get user data by UID
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            setUserData(data);
          } else {
            // If this is the admin@zellak.de user, migrate it to username-based auth
            if (user.email === 'admin@zellak.de') {
              const adminData = {
                username: 'admin',
                isAdmin: true,
                companyName: 'Zellak Admin',
                category: 'A' as const,
                createdAt: new Date().toISOString()
              };
              
              // Store admin data
              await setDoc(doc(db, 'users', user.uid), adminData);
              
              // Store username mapping
              await setDoc(doc(db, 'usernames', 'admin'), {
                uid: user.uid,
                username: 'admin'
              });
              
              setUserData(adminData);
            }
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (
    username: string,
    password: string,
    userData: Omit<UserData, 'isAdmin' | 'username'>
  ) => {
    try {
      setError(null);
      
      // Check if username already exists
      const usernameQuery = query(collection(db, 'usernames'), where('username', '==', username.toLowerCase()));
      const usernameSnapshot = await getDocs(usernameQuery);
      
      if (!usernameSnapshot.empty) {
        throw new Error('Username already taken');
      }

      // Create a placeholder email for Firebase auth
      const email = `${username.toLowerCase()}@placeholder.com`;
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Store the user data
      const newUserData = {
        ...userData,
        username: username.toLowerCase(),
        isAdmin: false,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', user.uid), newUserData);

      // Store username mapping
      await setDoc(doc(db, 'usernames', username.toLowerCase()), {
        uid: user.uid,
        username: username.toLowerCase()
      });

      setUserData(newUserData);

    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      // Special case for admin login during migration
      if (username.toLowerCase() === 'admin') {
        try {
          // First try the old admin email
          const { user } = await signInWithEmailAndPassword(auth, 'admin@zellak.de', password);
          
          // Get or create admin user data
          let userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            const adminData = {
              username: 'admin',
              isAdmin: true,
              companyName: 'Zellak Admin',
              category: 'A' as const,
              createdAt: new Date().toISOString()
            };
            
            // Store admin data
            await setDoc(doc(db, 'users', user.uid), adminData);
            
            // Store username mapping
            await setDoc(doc(db, 'usernames', 'admin'), {
              uid: user.uid,
              username: 'admin'
            });
            
            setUserData(adminData);
          } else {
            setUserData(userDoc.data() as UserData);
          }
          
          navigate('/admin');
          return;
        } catch (adminErr) {
          // If old admin login fails, continue with normal flow
          console.log('Admin migration login failed, trying normal flow');
        }
      }
      
      // Normal username-based login flow
      const usernameQuery = query(collection(db, 'usernames'), where('username', '==', username.toLowerCase()));
      const usernameSnapshot = await getDocs(usernameQuery);
      
      if (usernameSnapshot.empty) {
        setError('Invalid username or password');
        throw new Error('User not found');
      }

      const uid = usernameSnapshot.docs[0].data().uid;
      
      // Get the user document
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) {
        setError('Invalid username or password');
        throw new Error('User data not found');
      }

      // Use the placeholder email format for login
      const loginEmail = `${username.toLowerCase()}@placeholder.com`;
      
      // Login with email and password
      const { user } = await signInWithEmailAndPassword(auth, loginEmail, password);
      
      const userData = userDoc.data() as UserData;
      setUserData(userData);
      
      if (userData.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError('Invalid username or password');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserData(null);
      sessionStorage.clear();
      navigate('/login', { replace: true });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const clearError = () => setError(null);

  const value = {
    currentUser,
    userData,
    loading,
    error,
    login,
    register,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}