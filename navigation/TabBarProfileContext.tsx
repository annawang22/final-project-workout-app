import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getProfile } from "../utils/storage";

type TabBarProfileContextValue = {
  /** Profile image URI for the active user only; from `getProfile()` (never another user). */
  profileTabImageUri: string | null;
  refreshProfileTabIcon: () => Promise<void>;
};

const TabBarProfileContext = createContext<TabBarProfileContextValue | null>(
  null,
);

export function TabBarProfileProvider({ children }: { children: ReactNode }) {
  const [profileTabImageUri, setProfileTabImageUri] = useState<string | null>(
    null,
  );

  const refreshProfileTabIcon = useCallback(async () => {
    try {
      const p = await getProfile();
      if (!p) {
        setProfileTabImageUri(null);
        return;
      }
      const raw = p.profileImage;
      const uri =
        raw != null && String(raw).trim() !== "" ? String(raw).trim() : null;
      setProfileTabImageUri(uri);
    } catch {
      setProfileTabImageUri(null);
    }
  }, []);

  useEffect(() => {
    void refreshProfileTabIcon();
  }, [refreshProfileTabIcon]);

  const value = useMemo(
    () => ({ profileTabImageUri, refreshProfileTabIcon }),
    [profileTabImageUri, refreshProfileTabIcon],
  );

  return (
    <TabBarProfileContext.Provider value={value}>
      {children}
    </TabBarProfileContext.Provider>
  );
}

export function useTabBarProfile(): TabBarProfileContextValue {
  const ctx = useContext(TabBarProfileContext);
  if (ctx == null) {
    throw new Error("useTabBarProfile must be used within TabBarProfileProvider");
  }
  return ctx;
}
