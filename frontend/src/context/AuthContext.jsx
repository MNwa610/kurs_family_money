import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as api from '@/api/index.js';
import { clearToken, getToken, setToken } from '@/api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hasHousehold, setHasHousehold] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setHasHousehold(false);
      setLoading(false);
      return;
    }
    try {
      const { user: me, hasHousehold: inHousehold } = await api.fetchMe();
      setUser(me);
      setHasHousehold(Boolean(inHousehold));
    } catch {
      clearToken();
      setUser(null);
      setHasHousehold(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const applyAuthResponse = useCallback((payload) => {
    setToken(payload.token);
    setUser(payload.user);
    setHasHousehold(Boolean(payload.hasHousehold));
    return payload.user;
  }, []);

  const login = useCallback(async (email, password) => {
    const payload = await api.login(email, password);
    return applyAuthResponse(payload);
  }, [applyAuthResponse]);

  const register = useCallback(async (email, password, name) => {
    const payload = await api.register(email, password, name);
    return applyAuthResponse(payload);
  }, [applyAuthResponse]);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setHasHousehold(false);
  }, []);

  const updateProfile = useCallback(async (body) => {
    const { user: updated } = await api.updateProfile(body);
    setUser(updated);
    return updated;
  }, []);

  const createHousehold = useCallback(async (name) => {
    const res = await api.createHousehold(name);
    setHasHousehold(true);
    return res;
  }, []);

  const joinHousehold = useCallback(async (token) => {
    const res = await api.acceptHouseholdInvite(token);
    setHasHousehold(true);
    return res;
  }, []);

  const value = useMemo(
    () => ({
      user,
      hasHousehold,
      loading,
      login,
      register,
      logout,
      updateProfile,
      createHousehold,
      joinHousehold,
      refreshSession: loadUser,
    }),
    [
      user,
      hasHousehold,
      loading,
      login,
      register,
      logout,
      updateProfile,
      createHousehold,
      joinHousehold,
      loadUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
