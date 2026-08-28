import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

const STORAGE_KEY_PREFIX = "@trusolution/wellness-state-v2";
const WellnessContext = createContext(null);

const initialState = {
  moodEntries: [],
  journalEntries: [],
  profile: {
    fullName: "",
    username: "",
    email: "",
    selectedIssues: [],
    profileMode: "",
    nickname: "",
    bio: "",
    avatarIndex: 0,
    profileImageUri: "",
  },
  preferences: {
    anonymousPosting: true,
    profileVisible: false,
    wellnessInsightsSharing: false,
    sharingMode: "",
    focusMode: "",
  },
  supportPlan: {
    warningSigns: "",
    copingSteps: "",
    trustedContacts: [],
  },
};

const createId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function WellnessProvider({ children }) {
  const { currentUser, isHydrated: isAuthHydrated, updateCurrentUser } =
    useAuth();
  const currentUserId = currentUser?.id;
  const [state, setState] = useState(initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isActive = true;

    const restoreState = async () => {
      // Never show one account's data while another account is being restored.
      setIsHydrated(false);
      setState(initialState);

      if (!isAuthHydrated) {
        return;
      }

      if (!currentUserId) {
        if (isActive) {
          setIsHydrated(true);
        }
        return;
      }

      try {
        const storageKey = `${STORAGE_KEY_PREFIX}:${currentUserId}`;
        const savedState = await AsyncStorage.getItem(storageKey);
        const accountProfile = {
          ...initialState.profile,
          fullName: currentUser.fullName || "",
          username: currentUser.username || "",
          email: currentUser.email || "",
          profileImageUri: currentUser.profileImageUri || "",
        };

        if (savedState && isActive) {
          const parsed = JSON.parse(savedState);
          setState({
            ...initialState,
            ...parsed,
            profile: { ...accountProfile, ...parsed.profile },
            preferences: { ...initialState.preferences, ...parsed.preferences },
            supportPlan: { ...initialState.supportPlan, ...parsed.supportPlan },
          });
        } else if (isActive) {
          setState({ ...initialState, profile: accountProfile });
        }
      } catch (error) {
        console.warn("Unable to restore wellness data", error);
      } finally {
        if (isActive) {
          setIsHydrated(true);
        }
      }
    };

    restoreState();
    return () => {
      isActive = false;
    };
  }, [currentUserId, isAuthHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    // Wellness data belongs to the signed-in account, never to the device globally.
    if (!currentUserId) {
      return;
    }

    AsyncStorage.setItem(
      `${STORAGE_KEY_PREFIX}:${currentUserId}`,
      JSON.stringify(state),
    ).catch((error) => {
      console.warn("Unable to save wellness data", error);
    });
  }, [currentUserId, isHydrated, state]);

  const value = useMemo(
    () => ({
      ...state,
      isHydrated,
      addMoodEntry: ({
        moodId,
        moodLabel,
        moodEmoji,
        severity,
        severityLabel,
      }) => {
        const entry = {
          id: createId("mood"),
          moodId,
          moodLabel,
          moodEmoji,
          severity,
          severityLabel,
          createdAt: new Date().toISOString(),
        };
        setState((current) => ({
          ...current,
          moodEntries: [entry, ...current.moodEntries],
        }));
        return entry;
      },
      addJournalEntry: ({ text, mood, prompt }) => {
        const entry = {
          id: createId("journal"),
          text: text.trim(),
          mood,
          prompt,
          date: new Date().toISOString(),
        };
        setState((current) => ({
          ...current,
          journalEntries: [entry, ...current.journalEntries],
        }));
        return entry;
      },
      deleteJournalEntry: (entryId) => {
        setState((current) => ({
          ...current,
          journalEntries: current.journalEntries.filter(
            (entry) => entry.id !== entryId,
          ),
        }));
      },
      updateProfile: (updates) => {
        setState((current) => ({
          ...current,
          profile: { ...current.profile, ...updates },
        }));

        // Keep sign-in/account identity in sync with the displayed profile.
        const accountUpdates = {};
        ["fullName", "username", "email", "profileImageUri"].forEach((key) => {
          if (Object.prototype.hasOwnProperty.call(updates, key)) {
            accountUpdates[key] = updates[key];
          }
        });
        if (Object.keys(accountUpdates).length > 0) {
          updateCurrentUser(accountUpdates);
        }
      },
      updatePreferences: (updates) => {
        setState((current) => ({
          ...current,
          preferences: { ...current.preferences, ...updates },
        }));
      },
      updateSupportPlan: (updates) => {
        setState((current) => ({
          ...current,
          supportPlan: { ...current.supportPlan, ...updates },
        }));
      },
    }),
    [isHydrated, state],
  );

  return (
    <WellnessContext.Provider value={value}>
      {children}
    </WellnessContext.Provider>
  );
}

export function useWellness() {
  const value = useContext(WellnessContext);
  if (!value) {
    throw new Error("useWellness must be used within WellnessProvider");
  }
  return value;
}
