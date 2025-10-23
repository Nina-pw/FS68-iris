// src/utils/useEnsureAuthed.ts
import { useAuth } from "../context/AuthContext";

export function useEnsureAuthed() {
  const { currentUser, isReady } = useAuth();
  return {
    loading: !isReady,
    authed: !!currentUser,
    user: currentUser,
  };
}
