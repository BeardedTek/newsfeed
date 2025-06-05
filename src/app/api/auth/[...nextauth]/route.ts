import NextAuth from "next-auth";
import type { OAuthUserConfig, OAuthConfig } from "next-auth/providers/oauth";
import type { EventCallbacks } from "next-auth";

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
      console.log('Token Request - Params:', JSON.stringify(params, null, 2));
      console.log('Token Request - Provider:', JSON.stringify(provider, null, 2));
      
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
      console.log('Token Response:', response);
      const data = await response.text();
      console.log('Token Response Data:', data);

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
      console.log('UserInfo Request - Tokens:', JSON.stringify(tokens, null, 2));
      
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
      console.log('UserInfo Response:', data);

      try {
        return JSON.parse(data);
      } catch (error) {
        console.error('UserInfo Parse Error:', error);
        throw new Error('Failed to parse userinfo response');
      }
    },
  },
  profile(profile: CasdoorProfile) {
    console.log('Casdoor Profile Response:', JSON.stringify(profile, null, 2));
    return {
      id: profile.sub,
      name: profile.name || null,
      email: profile.email || null,
      image: profile.picture || null,
    };
  },
};

const authOptions = {
  providers: [casdoorProvider],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: true,
  callbacks: {
    async jwt({ token, account, profile }) {
      console.log('JWT Callback - Token:', JSON.stringify(token, null, 2));
      console.log('JWT Callback - Account:', JSON.stringify(account, null, 2));
      console.log('JWT Callback - Profile:', JSON.stringify(profile, null, 2));
      
      if (account && profile && 'sub' in profile) {
        token.accessToken = account.access_token;
        token.id = profile.sub as string;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session Callback - Session:', JSON.stringify(session, null, 2));
      console.log('Session Callback - Token:', JSON.stringify(token, null, 2));
      
      if (session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      console.log('SignIn Callback - User:', JSON.stringify(user, null, 2));
      console.log('SignIn Callback - Account:', JSON.stringify(account, null, 2));
      console.log('SignIn Callback - Profile:', JSON.stringify(profile, null, 2));
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect Callback - URL:', url);
      console.log('Redirect Callback - BaseURL:', baseUrl);
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  events: {
    async signIn(message) {
      console.log('SignIn Event:', JSON.stringify(message, null, 2));
    },
    async signOut(message) {
      console.log('SignOut Event:', JSON.stringify(message, null, 2));
    },
  } as Partial<EventCallbacks>,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions }; 