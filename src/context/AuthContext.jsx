import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/endpoints';
import { TOKEN_KEY } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Only wait for a profile fetch when a token exists.
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  const refreshUser = useCallback(async () => {
    const res = await authApi.getProfile();
    setUser(res.data.data);
    return res.data.data;
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    authApi.getProfile()
      .then(res => setUser(res.data.data))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    localStorage.setItem(TOKEN_KEY, res.data.data.token);
    return refreshUser();
  };

  // Registration already returns a token (AuthResponseDto): use it instead of forcing a second sign-in.
  const loginWithToken = async (token) => {
    localStorage.setItem(TOKEN_KEY, token);
    return refreshUser();
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('landease.chat.sessionId');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithToken, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
