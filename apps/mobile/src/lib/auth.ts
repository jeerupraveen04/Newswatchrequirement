import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { api, setAccessToken } from "./api";

const ACCESS_KEY = "nw_access";
const REFRESH_KEY = "nw_refresh";

export interface SessionUser {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string;
  username: string;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
}

interface MeResponse {
  user: SessionUser;
  role: string;
  regionScopes: string[];
  reporterStatus: string | null;
}

interface SessionResponse {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface AuthState {
  user: SessionUser | null;
  role: string | null;
  reporterStatus: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  isReporter: () => boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<SessionUser>;
  register: (input: { email: string; password: string; displayName: string }) => Promise<SessionUser>;
  requestOtp: (input: { identifier: string; channel: "sms" | "email"; purpose?: "login" | "signup" | "reset" }) => Promise<{ requestId: string; expiresInSec: number; resendAfterSec: number }>;
  verifyOtp: (input: { identifier: string; code: string; purpose?: "login" | "signup" | "reset" }) => Promise<SessionUser | null>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (input: { email: string; code: string; newPassword: string }) => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (patch: Partial<SessionUser>) => void;
  logout: () => Promise<void>;
}

async function persistSession(res: SessionResponse) {
  setAccessToken(res.accessToken);
  await SecureStore.setItemAsync(ACCESS_KEY, res.accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, res.refreshToken);
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  reporterStatus: null,
  refreshToken: null,
  hydrated: false,

  isReporter() {
    const role = get().role;
    return role === "reporter" || role === "admin" || role === "super_admin";
  },

  async hydrate() {
    const access = await SecureStore.getItemAsync(ACCESS_KEY);
    const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
    if (access) {
      setAccessToken(access);
      try {
        const me = await api<MeResponse>("/auth/me");
        set({ user: me.user, role: me.role, reporterStatus: me.reporterStatus, refreshToken: refresh, hydrated: true });
        return;
      } catch {
        // access token expired — try refresh
        if (refresh) {
          try {
            const res = await api<SessionResponse>("/auth/refresh", { method: "POST", body: { refreshToken: refresh } });
            await persistSession(res);
            const me = await api<MeResponse>("/auth/me");
            set({ user: me.user, role: me.role, reporterStatus: me.reporterStatus, refreshToken: res.refreshToken, hydrated: true });
            return;
          } catch {
            await SecureStore.deleteItemAsync(ACCESS_KEY);
            await SecureStore.deleteItemAsync(REFRESH_KEY);
          }
        }
      }
    }
    set({ hydrated: true });
  },

  async login(email, password) {
    const res = await api<SessionResponse>("/auth/login", { method: "POST", body: { email, password } });
    await persistSession(res);
    let reporterStatus: string | null = null;
    try {
      const me = await api<MeResponse>("/auth/me");
      reporterStatus = me.reporterStatus;
    } catch {
      /* non-fatal */
    }
    set({ user: res.user, role: res.user.role, reporterStatus, refreshToken: res.refreshToken });
    return res.user;
  },

  async register(input) {
    const res = await api<SessionResponse>("/auth/register", { method: "POST", body: input });
    await persistSession(res);
    set({ user: res.user, role: res.user.role, reporterStatus: null, refreshToken: res.refreshToken });
    return res.user;
  },

  async requestOtp(input) {
    return api<{ requestId: string; expiresInSec: number; resendAfterSec: number }>("/auth/otp/request", {
      method: "POST",
      body: { purpose: "login", ...input },
    });
  },

  async verifyOtp(input) {
    const res = await api<SessionResponse & { resetVerified?: boolean }>("/auth/otp/verify", {
      method: "POST",
      body: { purpose: "login", ...input },
    });
    if (res.resetVerified) return null;
    await persistSession(res);
    set({ user: res.user, role: res.user.role, reporterStatus: null, refreshToken: res.refreshToken });
    return res.user;
  },

  async forgotPassword(email) {
    await api("/auth/password/forgot", { method: "POST", body: { email } });
  },

  async resetPassword(input) {
    await api("/auth/password/reset", { method: "POST", body: input });
  },

  async refreshSession() {
    const refresh = get().refreshToken ?? (await SecureStore.getItemAsync(REFRESH_KEY));
    if (!refresh) throw new Error("No session");
    const res = await api<SessionResponse>("/auth/refresh", { method: "POST", body: { refreshToken: refresh } });
    await persistSession(res);
    set({ user: res.user, role: res.user.role, refreshToken: res.refreshToken });
  },

  updateUser(patch) {
    const current = get().user;
    if (current) set({ user: { ...current, ...patch } });
  },

  async logout() {
    const refresh = get().refreshToken;
    if (refresh) await api("/auth/logout", { method: "POST", body: { refreshToken: refresh } }).catch(() => undefined);
    setAccessToken(null);
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    set({ user: null, role: null, reporterStatus: null, refreshToken: null });
  },
}));
