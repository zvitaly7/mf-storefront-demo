import React, { createContext, useContext, useReducer } from 'react';

interface User {
  id: string;
  name: string;
}

interface AuthState {
  user: User | null;
}

type AuthAction =
  | { type: 'login'; user: User }
  | { type: 'logout' };

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'login':  return { user: action.user };
    case 'logout': return { user: null };
  }
}

interface AuthContextValue {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Auth state can be seeded from server (session cookie, edge middleware, etc.).
export function AuthProvider({
  initialUser = null,
  children,
}: {
  initialUser?: User | null;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, { user: initialUser });
  const value: AuthContextValue = {
    user: state.user,
    login: (user) => dispatch({ type: 'login', user }),
    logout: () => dispatch({ type: 'logout' }),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthStore(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthStore must be used inside <AuthProvider>');
  return ctx;
}
