import { ReactNode } from "react";

// InstantDB doesn't need a provider - it's initialized directly in lib/instant.ts
export default function InstantProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}