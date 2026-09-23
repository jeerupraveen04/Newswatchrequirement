import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { api, setAccessToken } from "./api";

const ACCESS_KEY = "nw_access";
const REFRESH_KEY = "nw_refresh";

export interface SessionUser {
  id: string;
  email: string | null;
  displayName: string;
  username: string;
  role: string;
  avatarUrl: string | null;
}

interface AuthState {
  user: SessionUser | null;
  role: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  refreshToken: null,
  hydrated: false,

  async hydrate() {
    const access = await SecureStore.getItemAsync(ACCESS_KEY);
    const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
    if (access) {
      setAccessToken(access);
      try {
        const me = await api<{ user: SessionUser; role: string }>("/auth/me");
        set({ user: me.user, role: me.role, refreshToken: refresh, hydrated: true });
        return;
      } catch {
        /* fall through */
      }
    }
    set({ hydrated: true });
  },

  async login(email, password) {
    const res = await api<{ user: SessionUser; accessToken: string; refreshToken: string; expiresIn: number }>(
      "/auth/login",
      { method: "POST", body: { email, password } },
    );
    setAccessToken(res.accessToken);
    await SecureStore.setItemAsync(ACCESS_KEY, res.accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, res.refreshToken);
    set({ user: res.user, role: res.user.role, refreshToken: res.refreshToken });
  },

  async register(input) {
    const res = await api<{ user: SessionUser; accessToken: string; refreshToken: string }>("/auth/register", {
      method: "POST",
      body: input,
    });
    setAccessToken(res.accessToken);
    await SecureStore.setItemAsync(ACCESS_KEY, res.accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, res.refreshToken);
    set({ user: res.user, role: res.user.role, refreshToken: res.refreshToken });
  },

  async logout() {
    const refresh = get().refreshToken;
    if (refresh) await api("/auth/logout", { method: "POST", body: { refreshToken: refresh } }).catch(() => undefined);
    setAccessToken(null);
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    set({ user: null, role: null, refreshToken: null });
  },
}));
