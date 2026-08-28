import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.log("Error restoring session:", error.message);
        }

        setCurrentUser(session?.user ?? null);
      } catch (error) {
        console.log("Unexpected auth restore error:", error);
      } finally {
        setIsHydrated(true);
      }
    };

    restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async ({ fullName, username, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          username: username ? username.trim() : "",
        },
      },
    });

    if (error) {
      return {
        ok: false,
        error: error.message,
      };
    }

    return {
      ok: true,
      user: data.user,
      session: data.session,
    };
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return {
        ok: false,
        error: error.message,
      };
    }

    return {
      ok: true,
      user: data.user,
    };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log("Error signing out:", error.message);

      return {
        ok: false,
        error: error.message,
      };
    }

    setCurrentUser(null);

    return {
      ok: true,
    };
  };

  const forgotPassword = async ({ email }) => {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
    );

    if (error) {
      return {
        ok: false,
        error: error.message,
      };
    }

    return {
      ok: true,
      message: "Password reset instructions have been sent to your email.",
    };
  };

  const updateCurrentUser = async (updates) => {
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    });

    if (error) {
      return {
        ok: false,
        error: error.message,
      };
    }

    setCurrentUser(data.user);

    return {
      ok: true,
      user: data.user,
    };
  };

  const value = useMemo(
    () => ({
      currentUser,
      isHydrated,
      signUp,
      signIn,
      signOut,
      forgotPassword,
      updateCurrentUser,
    }),
    [currentUser, isHydrated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
}
