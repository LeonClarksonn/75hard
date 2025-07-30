import React from "react";
import {
  ClerkProvider as ClerkProviderBase,
  ClerkLoaded,
} from "@clerk/clerk-expo";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env.local"
  );
}

// Token cache for Clerk
const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      return item;
    } catch (error) {
      console.error("Error getting token from cache:", error);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error("Error saving token to cache:", error);
    }
  },
  async clearToken(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error("Error clearing token from cache:", error);
    }
  },
};

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProviderBase
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <ClerkLoaded>{children}</ClerkLoaded>
    </ClerkProviderBase>
  );
}
