import { AuthOptions } from "next-auth";
import type { OAuthConfig } from "next-auth/providers/oauth";

interface CasdoorProfile {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
}

// Use the client-side URL for OAuth redirects
const casdoorEndpoint = process.env.CASDOOR_ENDPOINT || 'http://localhost:8000';

const casdoorProvider: OAuthConfig<CasdoorProfile> = {
  id: "casdoor",
  name: "Casdoor",
  type: "oauth",
  clientId: process.env.CASDOOR_CLIENT_ID!,
  clientSecret: process.env.CASDOOR_CLIENT_SECRET!,
  authorization: {
    url: new URL('/login/oauth/authorize', casdoorEndpoint).toString(),
    params: {
      scope: "openid profile email address phone",
    },
  },
  token: {
    url: new URL('/api/login/oauth/access_token', casdoorEndpoint).toString(),
    async request({ client, params, checks, provider }) {
      if (!provider.token) {
        throw new Error('Token endpoint not configured');
      }

      const tokenUrl = typeof provider.token === 'string' ? provider.token : provider.token.url;
      if (!tokenUrl) {
        throw new Error('Token URL not found');
      }

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: provider.clientId,
          client_secret: provider.clientSecret,
          code: params.code,
          redirect_uri: provider.callbackUrl,
        } as Record<string, string>),
      });
      const data = await response.text();

      try {
        return { tokens: JSON.parse(data) };
      } catch (error) {
        console.error('Token Parse Error:', error);
        throw new Error('Failed to parse token response');
      }
    },
  },
  userinfo: {
    url: new URL('/api/userinfo', casdoorEndpoint).toString(),
    async request({ tokens, client, provider }) {
      if (!provider.userinfo) {
        throw new Error('Userinfo endpoint not configured');
      }

      const userinfoUrl = typeof provider.userinfo === 'string' ? provider.userinfo : provider.userinfo.url;
      if (!userinfoUrl) {
        throw new Error('Userinfo URL not found');
      }

      const response = await fetch(userinfoUrl, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      const data = await response.text();

      try {
        return JSON.parse(data);
      } catch (error) {
        console.error('UserInfo Parse Error:', error);
        throw new Error('Failed to parse userinfo response');
      }
    },
  },
  profile(profile: CasdoorProfile) {
    return {
      id: profile.sub,
      name: profile.name || null,
      email: profile.email || null,
      image: profile.picture || null,
    };
  },
};

export const authOptions: AuthOptions = {
  providers: [casdoorProvider],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        token.accessToken = account.access_token;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      return true;
    },
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
}; 