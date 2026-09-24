import { useEffect, useState } from "react";
import type { User } from "../types/user";
import Authenticator from "./authenticator";

/** The signed-in user, updated when they log in or out. */
export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(Authenticator.user);
  useEffect(() => {
    setUser(Authenticator.user);
    return Authenticator.addLoginStateListener(() => setUser(Authenticator.user));
  }, []);
  return user;
}
