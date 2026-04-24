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

// React Context + useReducer — shell-local state, no cross-MF federation.
// zustand was removed from scenario 5 because neither remote uses it and
// declaring it "shared" in shell only would be a ghost share.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { user: null });
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
