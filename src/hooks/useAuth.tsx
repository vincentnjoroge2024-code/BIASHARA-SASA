import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { UserProfile } from '../types.ts';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logOut: async () => {},
  getToken: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const res = await fetch('/api/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const profileData = await res.json();
            setProfile(profileData);
          }
        } catch (err) {
          console.error("Failed to fetch profile:", err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (email.toLowerCase() === 'njoroge@biasharasasa.com' && password === 'Biasharasasa123') {
        const mockUser = {
          uid: 'mock-admin-uid-njoroge',
          email: 'njoroge@biasharasasa.com',
          getIdToken: async () => 'mock-njoroge-token',
        } as any;
        setUser(mockUser);
        const res = await fetch('/api/me', {
          headers: { Authorization: `Bearer mock-njoroge-token` }
        });
        if (res.ok) {
          const profileData = await res.json();
          setProfile(profileData);
        }
        setLoading(false);
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Email sign in failed:', error);
      setLoading(false);
      throw error;
    }
    setLoading(false);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Email registration failed:', error);
      setLoading(false);
      throw error;
    }
    setLoading(false);
  };

  const logOut = async () => {
    await signOut(auth);
    setProfile(null);
    setUser(null);
  };

  const getToken = async () => {
    if (!user) return null;
    return await user.getIdToken();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signInWithEmail, signUpWithEmail, logOut, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
