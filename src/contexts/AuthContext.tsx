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
  email: string;
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
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, userData: Omit<UserData, 'isAdmin' | 'email' | 'username'>) => Promise<void>;
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
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            setUserData(data);
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
    email: string,
    username: string,
    password: string,
    userData: Omit<UserData, 'isAdmin' | 'email' | 'username'>
  ) => {
    try {
      setError(null);
      
      // Check if username already exists
      const usernameQuery = query(collection(db, 'usernames'), where('username', '==', username.toLowerCase()));
      const usernameSnapshot = await getDocs(usernameQuery);
      
      if (!usernameSnapshot.empty) {
        throw new Error('Username already taken');
      }

      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Store the user data
      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        email: user.email,
        username: username.toLowerCase(),
        isAdmin: false,
        createdAt: new Date().toISOString()
      });

      // Store username mapping
      await setDoc(doc(db, 'usernames', username.toLowerCase()), {
        uid: user.uid,
        username: username.toLowerCase()
      });

    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      let loginEmail = usernameOrEmail;

      // Check if input is not an email (no @ symbol)
      if (!usernameOrEmail.includes('@')) {
        // Try to find email by username
        const usernameQuery = query(collection(db, 'usernames'), where('username', '==', usernameOrEmail.toLowerCase()));
        const usernameSnapshot = await getDocs(usernameQuery);
        
        if (usernameSnapshot.empty) {
          setError(t('login.invalidUsernameOrPassword'));
          throw new Error('User not found');
        }

        // Get the user document
        const userDoc = await getDoc(doc(db, 'users', usernameSnapshot.docs[0].data().uid));
        if (!userDoc.exists()) {
          setError(t('login.invalidUsernameOrPassword'));
          throw new Error('User data not found');
        }

        const userData = userDoc.data() as UserData;
        loginEmail = userData.email;
      }
      
      // Login with email and password
      const { user } = await signInWithEmailAndPassword(auth, loginEmail, password);
      
      // Get user data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        setError(t('login.invalidUsernameOrPassword'));
        throw new Error('User data not found');
      }

      const userData = userDoc.data() as UserData;
      setUserData(userData);
      
      if (userData.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(t('login.invalidUsernameOrPassword'));
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
      // Clear session data
      sessionStorage.clear();
      // Use navigate instead of location.href to prevent full page reload
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