import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const WellnessContext = createContext(null);

const emptyProfile = {
  fullName: "",
  username: "",
  email: "",
  selectedIssues: [],
  profileMode: "",
  nickname: "",
  bio: "",
  avatarIndex: 0,
  profileImageUri: "",
};

const emptyPreferences = {
  anonymousPosting: true,
  profileVisible: false,
  wellnessInsightsSharing: false,
  sharingMode: "",
  focusMode: "",
};

// --- mappers between snake_case DB rows and the app's camelCase shape ---

const rowToProfile = (row) => ({
  fullName: row?.full_name || "",
  username: row?.username || "",
  email: row?.email || "",
  selectedIssues: row?.selected_issues || [],
  profileMode: row?.profile_mode || "",
  nickname: row?.nickname || "",
  bio: row?.bio || "",
  avatarIndex: row?.avatar_index ?? 0,
  profileImageUri: row?.profile_image_uri || "",
});

const rowToPreferences = (row) => ({
  anonymousPosting: row?.anonymous_posting ?? true,
  profileVisible: row?.profile_visible ?? false,
  wellnessInsightsSharing: row?.wellness_insights_sharing ?? false,
  sharingMode: row?.sharing_mode || "",
  focusMode: row?.focus_mode || "",
});

const rowToSupportPlanBase = (row) => ({
  warningSigns: row?.warning_signs || "",
  copingSteps: row?.coping_steps || "",
});

const contactRowToContact = (row) => ({
  id: row.id,
  name: row.name,
  phone: row.phone || "",
  relationship: row.relationship || "",
});

const moodRowToEntry = (row) => ({
  id: row.id,
  moodId: row.mood_id,
  moodLabel: row.mood_label,
  moodEmoji: row.mood_emoji,
  severity: row.severity,
  severityLabel: row.severity_label,
  createdAt: row.created_at,
});

const journalRowToEntry = (row) => ({
  id: row.id,
  text: row.text,
  mood: row.mood,
  prompt: row.prompt,
  date: row.created_at,
});

// profile updates -> DB column names
const profileFieldMap = {
  fullName: "full_name",
  username: "username",
  email: "email",
  selectedIssues: "selected_issues",
  profileMode: "profile_mode",
  nickname: "nickname",
  bio: "bio",
  avatarIndex: "avatar_index",
  profileImageUri: "profile_image_uri",
};

const preferencesFieldMap = {
  anonymousPosting: "anonymous_posting",
  profileVisible: "profile_visible",
  wellnessInsightsSharing: "wellness_insights_sharing",
  sharingMode: "sharing_mode",
  focusMode: "focus_mode",
};

const supportPlanFieldMap = {
  warningSigns: "warning_signs",
  copingSteps: "coping_steps",
};

export function WellnessProvider({ children }) {
  const { currentUser, isHydrated: isAuthHydrated, updateCurrentUser } =
    useAuth();
  const currentUserId = currentUser?.id;

  const [profile, setProfile] = useState(emptyProfile);
  const [preferences, setPreferences] = useState(emptyPreferences);
  const [supportPlanBase, setSupportPlanBase] = useState({
    warningSigns: "",
    copingSteps: "",
  });
  const [trustedContacts, setTrustedContacts] = useState([]);
  const [moodEntries, setMoodEntries] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isActive = true;

    const restoreState = async () => {
      setIsHydrated(false);
      setProfile(emptyProfile);
      setPreferences(emptyPreferences);
      setSupportPlanBase({ warningSigns: "", copingSteps: "" });
      setTrustedContacts([]);
      setMoodEntries([]);
      setJournalEntries([]);

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
        const [profileResult, contactsResult, moodResult, journalResult] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("*")
              .eq("id", currentUserId)
              .maybeSingle(),
            supabase
              .from("trusted_contacts")
              .select("*")
              .eq("user_id", currentUserId)
              .order("created_at", { ascending: true }),
            supabase
              .from("mood_entries")
              .select("*")
              .eq("user_id", currentUserId)
              .order("created_at", { ascending: false }),
            supabase
              .from("journal_entries")
              .select("*")
              .eq("user_id", currentUserId)
              .order("created_at", { ascending: false }),
          ]);

        if (!isActive) return;

        if (profileResult.error) {
          console.warn("Unable to load profile", profileResult.error.message);
        } else if (profileResult.data) {
          setProfile(rowToProfile(profileResult.data));
          setPreferences(rowToPreferences(profileResult.data));
          setSupportPlanBase(rowToSupportPlanBase(profileResult.data));
        }

        if (contactsResult.error) {
          console.warn(
            "Unable to load trusted contacts",
            contactsResult.error.message,
          );
        } else if (contactsResult.data) {
          setTrustedContacts(contactsResult.data.map(contactRowToContact));
        }

        if (moodResult.error) {
          console.warn("Unable to load mood entries", moodResult.error.message);
        } else if (moodResult.data) {
          setMoodEntries(moodResult.data.map(moodRowToEntry));
        }

        if (journalResult.error) {
          console.warn(
            "Unable to load journal entries",
            journalResult.error.message,
          );
        } else if (journalResult.data) {
          setJournalEntries(journalResult.data.map(journalRowToEntry));
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

  const value = useMemo(
    () => ({
      moodEntries,
      journalEntries,
      profile,
      preferences,
      supportPlan: { ...supportPlanBase, trustedContacts },
      isHydrated,

      addMoodEntry: async ({
        moodId,
        moodLabel,
        moodEmoji,
        severity,
        severityLabel,
      }) => {
        const { data, error } = await supabase
          .from("mood_entries")
          .insert({
            user_id: currentUserId,
            mood_id: moodId,
            mood_label: moodLabel,
            mood_emoji: moodEmoji,
            severity,
            severity_label: severityLabel,
          })
          .select()
          .single();

        if (error) {
          console.warn("Unable to save mood entry", error.message);
          return null;
        }

        const entry = moodRowToEntry(data);
        setMoodEntries((current) => [entry, ...current]);
        return entry;
      },

      addJournalEntry: async ({ text, mood, prompt }) => {
        const { data, error } = await supabase
          .from("journal_entries")
          .insert({
            user_id: currentUserId,
            text: text.trim(),
            mood,
            prompt,
          })
          .select()
          .single();

        if (error) {
          console.warn("Unable to save journal entry", error.message);
          return null;
        }

        const entry = journalRowToEntry(data);
        setJournalEntries((current) => [entry, ...current]);
        return entry;
      },

      deleteJournalEntry: async (entryId) => {
        const { error } = await supabase
          .from("journal_entries")
          .delete()
          .eq("id", entryId)
          .eq("user_id", currentUserId);

        if (error) {
          console.warn("Unable to delete journal entry", error.message);
          return;
        }

        setJournalEntries((current) =>
          current.filter((entry) => entry.id !== entryId),
        );
      },

      updateProfile: async (updates) => {
        setProfile((current) => ({ ...current, ...updates }));

        const dbUpdates = {};
        Object.keys(updates).forEach((key) => {
          const column = profileFieldMap[key];
          if (column) {
            dbUpdates[column] = updates[key];
          }
        });

        if (Object.keys(dbUpdates).length > 0 && currentUserId) {
          const { error } = await supabase
            .from("profiles")
            .update(dbUpdates)
            .eq("id", currentUserId);

          if (error) {
            console.warn("Unable to update profile", error.message);
          }
        }

        // Keep auth identity metadata in sync for display purposes.
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

      updatePreferences: async (updates) => {
        setPreferences((current) => ({ ...current, ...updates }));

        const dbUpdates = {};
        Object.keys(updates).forEach((key) => {
          const column = preferencesFieldMap[key];
          if (column) {
            dbUpdates[column] = updates[key];
          }
        });

        if (Object.keys(dbUpdates).length > 0 && currentUserId) {
          const { error } = await supabase
            .from("profiles")
            .update(dbUpdates)
            .eq("id", currentUserId);

          if (error) {
            console.warn("Unable to update preferences", error.message);
          }
        }
      },

      updateSupportPlan: async (updates) => {
        const { trustedContacts: nextContacts, ...planFieldUpdates } = updates;

        if (Object.keys(planFieldUpdates).length > 0) {
          setSupportPlanBase((current) => ({ ...current, ...planFieldUpdates }));

          const dbUpdates = {};
          Object.keys(planFieldUpdates).forEach((key) => {
            const column = supportPlanFieldMap[key];
            if (column) {
              dbUpdates[column] = planFieldUpdates[key];
            }
          });

          if (Object.keys(dbUpdates).length > 0 && currentUserId) {
            const { error } = await supabase
              .from("profiles")
              .update(dbUpdates)
              .eq("id", currentUserId);

            if (error) {
              console.warn("Unable to update support plan", error.message);
            }
          }
        }

        if (nextContacts && currentUserId) {
          // Only add newly-appeared contacts (no id yet stored server-side).
          const existingIds = new Set(trustedContacts.map((c) => c.id));
          const newOnes = nextContacts.filter((c) => !existingIds.has(c.id));

          for (const contact of newOnes) {
            const { data, error } = await supabase
              .from("trusted_contacts")
              .insert({
                user_id: currentUserId,
                name: contact.name,
                phone: contact.phone,
                relationship: contact.relationship || null,
              })
              .select()
              .single();

            if (error) {
              console.warn("Unable to add trusted contact", error.message);
            } else {
              setTrustedContacts((current) => [
                ...current,
                contactRowToContact(data),
              ]);
            }
          }
        }
      },

      removeTrustedContact: async (contactId) => {
        const { error } = await supabase
          .from("trusted_contacts")
          .delete()
          .eq("id", contactId)
          .eq("user_id", currentUserId);

        if (error) {
          console.warn("Unable to remove trusted contact", error.message);
          return;
        }

        setTrustedContacts((current) =>
          current.filter((contact) => contact.id !== contactId),
        );
      },
    }),
    [
      moodEntries,
      journalEntries,
      profile,
      preferences,
      supportPlanBase,
      trustedContacts,
      isHydrated,
      currentUserId,
      updateCurrentUser,
    ],
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
