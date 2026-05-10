import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import {
  ANON_FAITH_STORAGE_KEY,
  DEFAULT_FAITH,
  FAITH_CONFIGS,
  getFaithConfig,
  isValidFaithKey,
  type FaithConfig,
  type FaithKey,
} from "~/utils/faithConfig";
import { useAuth } from "./AuthContext";
import { userPreferencesAPI } from "~/services/api";

interface FaithContextType {
  faith: FaithKey;
  config: FaithConfig;
  isExplicit: boolean; // true once the user has made a choice (anon or auth)
  setFaith: (key: FaithKey) => Promise<void>;
}

const FaithContext = createContext<FaithContextType | undefined>(undefined);

export const FaithProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, refreshUser } = useAuth();

  // Anonymous-user faith choice from localStorage
  const [anonFaith, setAnonFaithState] = useState<FaithKey | null>(null);
  const [anonExplicit, setAnonExplicit] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(ANON_FAITH_STORAGE_KEY);
    if (isValidFaithKey(stored)) {
      setAnonFaithState(stored);
      setAnonExplicit(true);
    }
  }, []);

  const userFaith = isValidFaithKey(user?.preferences?.faith)
    ? user!.preferences!.faith!
    : null;

  const faith: FaithKey = userFaith ?? anonFaith ?? DEFAULT_FAITH;
  const config = getFaithConfig(faith);
  const isExplicit = isAuthenticated ? !!userFaith : anonExplicit;

  const setFaith = useCallback(
    async (key: FaithKey) => {
      if (isAuthenticated) {
        await userPreferencesAPI.updatePreferences({ faith: key });
        await refreshUser();
      } else if (typeof window !== "undefined") {
        localStorage.setItem(ANON_FAITH_STORAGE_KEY, key);
        setAnonFaithState(key);
        setAnonExplicit(true);
      }
    },
    [isAuthenticated, refreshUser],
  );

  const value = useMemo(
    () => ({ faith, config, isExplicit, setFaith }),
    [faith, config, isExplicit, setFaith],
  );

  return <FaithContext.Provider value={value}>{children}</FaithContext.Provider>;
};

export const useFaith = () => {
  const ctx = useContext(FaithContext);
  if (ctx === undefined) {
    throw new Error("useFaith must be used within a FaithProvider");
  }
  return ctx;
};

export { FAITH_CONFIGS };
