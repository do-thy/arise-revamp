import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from 'firebase/auth';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOutUser,
  subscribeToAuthState,
} from '../services/firebase';
import type { AppUser, AuthStatus } from '../types';

interface AuthContextValue {
  status: AuthStatus;
  user: AppUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toAppUser(user: User | null): AppUser | null {
  if (!user) return null;
  return { uid: user.uid, email: user.email, displayName: user.displayName };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      unsubscribe = subscribeToAuthState((firebaseUser) => {
        setUser(toAppUser(firebaseUser));
        setStatus(firebaseUser ? 'signedIn' : 'signedOut');
      });
    } catch {
      // Firebase not configured yet: fall through to signed-out so the Login screen
      // can surface a descriptive error when the user attempts to sign in.
      setStatus('signedOut');
    }
    return () => unsubscribe?.();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      signIn: async (email, password) => {
        await signInWithEmail(email, password);
      },
      signUp: async (email, password) => {
        await signUpWithEmail(email, password);
      },
      signInWithGoogle: async () => {
        await signInWithGoogle();
      },
      signOut: async () => {
        await signOutUser();
      },
    }),
    [status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
