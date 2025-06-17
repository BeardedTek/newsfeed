"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const casdoorConfig = {
  serverUrl: process.env.NEXT_PUBLIC_CASDOOR_SERVER_URL!,
  clientId: process.env.NEXT_PUBLIC_CASDOOR_CLIENT_ID!,
  clientSecret: process.env.NEXT_PUBLIC_CASDOOR_CLIENT_SECRET!,
  organizationName: process.env.NEXT_PUBLIC_CASDOOR_ORG_NAME!,
  appName: process.env.NEXT_PUBLIC_CASDOOR_APP_NAME!,
  redirectPath: process.env.NEXT_PUBLIC_CASDOOR_REDIRECT_URI!,
};

interface User {
  name: string;
  owner: string;
  createdTime: string;
  updatedTime: string;
  id: string;
  type: string;
  password: string;
  displayName: string;
  avatar: string;
  email: string;
  phone: string;
  address: string[];
  affiliation: string;
  tag: string;
  score: number;
  isAdmin: boolean;
  isGlobalAdmin: boolean;
  isForbidden: boolean;
  signupApplication: string;
  hash: string;
  preHash: string;
  accessKey: string;
  accessSecret: string;
  github: string;
  google: string;
  qq: string;
  wechat: string;
  facebook: string;
  dingtalk: string;
  weibo: string;
  gitee: string;
  linkedin: string;
  wecom: string;
  lark: string;
  gitlab: string;
  createdIp: string;
  lastSigninTime: string;
  lastSigninIp: string;
  preferredMfaType: string;
  recoveryCodes: string[] | null;
  totpSecret: string;
  mfaPhoneEnabled: boolean;
  mfaEmailEnabled: boolean;
  ldap: string;
  properties: Record<string, any>;
  roles: Array<{
    owner: string;
    name: string;
    createdTime: string;
    displayName: string;
    description: string;
    users: string[] | null;
    groups: string[];
    roles: string[];
    domains: string[];
    isEnabled: boolean;
  }>;
  permissions: string[];
  groups: string[];
  lastSigninWrongTime: string;
  signinWrongTimes: number;
  managedAccounts: string[] | null;
  tokenType: string;
  scope: string;
  azp: string;
  iss: string;
  sub: string;
  aud: string[];
  exp: number;
  nbf: number;
  iat: number;
  jti: string;
  jwt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userInfo = sessionStorage.getItem('casdoorUser');
    if (userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);
        setUser(parsedUser);
      } catch (error) {
        sessionStorage.removeItem('casdoorUser');
      }
    }
    setLoading(false);
  }, []);

  const logout = () => {
    sessionStorage.removeItem('casdoorUser');
    setUser(null);
    router.push('/admin');
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 