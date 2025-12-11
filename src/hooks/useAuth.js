import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "sgmakan_auth_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  
  const user = useQuery(api.auth.getUser, { token: token || undefined });
  const signupMutation = useMutation(api.auth.signup);
  const loginMutation = useMutation(api.auth.login);
  const logoutMutation = useMutation(api.auth.logout);

  // Save token to localStorage when it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  const signup = useCallback(async (email, password) => {
    const result = await signupMutation({ email, password });
    setToken(result.token);
    return result;
  }, [signupMutation]);

  const login = useCallback(async (email, password) => {
    const result = await loginMutation({ email, password });
    setToken(result.token);
    return result;
  }, [loginMutation]);

  const logout = useCallback(async () => {
    if (token) {
      await logoutMutation({ token });
    }
    setToken(null);
  }, [token, logoutMutation]);

  const value = useMemo(() => ({
    user,
    isLoading: user === undefined,
    isAuthenticated: !!user,
    signup,
    login,
    logout,
  }), [user, signup, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
