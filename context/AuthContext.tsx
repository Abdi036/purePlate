import { Models } from "appwrite";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  appwriteGetCurrentUser,
  appwriteSignIn,
  appwriteSignOut,
  appwriteSignUp,
} from "../lib/appwrite";

type User = Models.User<Models.Preferences>;

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  signIn: (params: { email: string; password: string }) => Promise<User>;
  signUp: (params: {
    name: string;
    email: string;
    password: string;
  }) => Promise<User>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const currentUser = await appwriteGetCurrentUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        if (!mounted) return;
        await refresh();
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [refresh]);

  const signIn = useCallback(
    async (params: { email: string; password: string }) => {
      const signedInUser = await appwriteSignIn(params);
      setUser(signedInUser);
      return signedInUser;
    },
    [],
  );

  const signUp = useCallback(
    async (params: { name: string; email: string; password: string }) => {
      const signedUpUser = await appwriteSignUp(params);
      setUser(signedUpUser);
      return signedUpUser;
    },
    [],
  );

  const signOut = useCallback(async () => {
    await appwriteSignOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, refresh, signIn, signUp, signOut }),
    [user, isLoading, refresh, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
