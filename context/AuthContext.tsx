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
  appwriteGetPrefs,
  appwriteSignIn,
  appwriteSignOut,
  appwriteSignUp,
  appwriteUpdateName,
  appwriteUpdatePrefs,
  appwriteUpsertRestaurant,
  UserPrefs,
  UserRole,
} from "../lib/appwrite";

type User = Models.User<Models.Preferences>;

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  prefs: UserPrefs | null;
  signIn: (params: { email: string; password: string }) => Promise<User>;
  signUp: (params: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => Promise<User>;
  signOut: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updatePrefs: (prefs: Partial<UserPrefs>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const currentUser = await appwriteGetCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      const currentPrefs = await appwriteGetPrefs();
      setPrefs(currentPrefs);

      if (currentPrefs?.role === "restaurant") {
        try {
          await appwriteUpsertRestaurant({
            userId: currentUser.$id,
            name: currentUser.name,
          });
        } catch (err: any) {
          console.warn(
            "Unable to sync restaurant profile:",
            typeof err?.message === "string" ? err.message : err,
          );
        }
      }
    } else {
      setPrefs(null);
    }
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
      const currentPrefs = await appwriteGetPrefs();
      setPrefs(currentPrefs);
      return signedInUser;
    },
    [],
  );

  const signUp = useCallback(
    async (params: {
      name: string;
      email: string;
      password: string;
      role: UserRole;
    }) => {
      const signedUpUser = await appwriteSignUp(params);
      setUser(signedUpUser);
      const currentPrefs = await appwriteGetPrefs();
      setPrefs(currentPrefs);
      return signedUpUser;
    },
    [],
  );

  const signOut = useCallback(async () => {
    await appwriteSignOut();
    setUser(null);
    setPrefs(null);
  }, []);

  const updateName = useCallback(
    async (name: string) => {
      const updatedUser = await appwriteUpdateName({ name });
      setUser(updatedUser);

      if (prefs?.role === "restaurant") {
        try {
          await appwriteUpsertRestaurant({
            userId: updatedUser.$id,
            name: updatedUser.name,
          });
        } catch (err: any) {
          console.warn(
            "Unable to sync restaurant profile:",
            typeof err?.message === "string" ? err.message : err,
          );
        }
      }
    },
    [prefs?.role],
  );

  const updatePrefs = useCallback(
    async (next: Partial<UserPrefs>) => {
      const merged = { ...(prefs ?? {}), ...next };
      const updatedUser = await appwriteUpdatePrefs(merged);
      setUser(updatedUser);
      const currentPrefs = await appwriteGetPrefs();
      setPrefs(currentPrefs);
    },
    [prefs],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      prefs,
      isLoading,
      refresh,
      signIn,
      signUp,
      signOut,
      updateName,
      updatePrefs,
    }),
    [
      user,
      prefs,
      isLoading,
      refresh,
      signIn,
      signUp,
      signOut,
      updateName,
      updatePrefs,
    ],
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
