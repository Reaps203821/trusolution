import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const TherapistContext = createContext(null);

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const todayIso = () => new Date().toISOString().slice(0, 10);

const formatTime = (isoString) =>
  new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const rowToTherapistProfile = (row) => ({
  id: row.id,
  fullName: row.full_name || "",
  photoUrl: row.photo_url || "",
  specialty: row.specialty || "",
  bio: row.bio || "",
  credentials: row.credentials || "",
  yearsExperience: row.years_experience ?? null,
  sessionTypes: row.session_types || [],
  isAcceptingClients: row.is_accepting_clients ?? true,
  rating: row.rating ?? 5.0,
});

const rowToAvailabilityWindow = (row) => ({
  id: row.id,
  dayOfWeek: row.day_of_week,
  dayName: DAY_NAMES[row.day_of_week],
  startTime: row.start_time?.slice(0, 5) || "09:00",
  endTime: row.end_time?.slice(0, 5) || "17:00",
  slotMinutes: row.slot_minutes || 60,
});

const rowToAppointmentRequest = (row) => ({
  id: row.id,
  bookingId: row.booking_id,
  clientId: row.user_id,
  clientDisplayName: row.client_display_name || "Client",
  date: row.date,
  time: row.time,
  sessionType: row.session_type,
  status: row.status,
  declineReason: row.decline_reason,
  createdAt: row.created_at,
});

const rowToConversation = (row, currentUserId) => ({
  id: row.id,
  therapistId: row.therapist_id,
  clientId: row.client_id,
  otherName:
    row.therapist_id === currentUserId
      ? row.client_display_name
      : row.therapist_display_name,
  lastMessageAt: row.last_message_at,
  lastMessagePreview: row.last_message_preview || "",
});

const rowToMessage = (row, currentUserId) => ({
  id: row.id,
  text: row.content,
  sender: row.sender_id === currentUserId ? "me" : "other",
  time: formatTime(row.created_at),
  createdAt: row.created_at,
});

export function TherapistProvider({ children }) {
  const { currentUser, isHydrated: isAuthHydrated } = useAuth();
  const currentUserId = currentUser?.id;

  const [therapistProfile, setTherapistProfile] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Active conversation thread (whichever one is currently open on screen).
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const messageChannelRef = useRef(null);

  const loadConversations = useCallback(async () => {
    if (!currentUserId) return;
    const { data, error } = await supabase
      .from("therapist_conversations")
      .select("*")
      .or(`therapist_id.eq.${currentUserId},client_id.eq.${currentUserId}`)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.warn("Unable to load conversations", error.message);
      return;
    }
    setConversations((data || []).map((row) => rowToConversation(row, currentUserId)));
  }, [currentUserId]);

  const loadAll = async () => {
    if (!currentUserId) return;

    const [profileResult, availabilityResult, appointmentsResult] =
      await Promise.all([
        supabase
          .from("therapist_profiles")
          .select("*")
          .eq("id", currentUserId)
          .maybeSingle(),
        supabase
          .from("therapist_availability")
          .select("*")
          .eq("therapist_id", currentUserId)
          .order("day_of_week", { ascending: true }),
        supabase
          .from("appointments")
          .select("*")
          .eq("therapist_id", currentUserId)
          .order("date", { ascending: true }),
      ]);

    if (profileResult.error) {
      console.warn("Unable to load therapist profile", profileResult.error.message);
    } else {
      setTherapistProfile(
        profileResult.data ? rowToTherapistProfile(profileResult.data) : null,
      );
    }

    if (availabilityResult.error) {
      console.warn(
        "Unable to load availability",
        availabilityResult.error.message,
      );
    } else if (availabilityResult.data) {
      setAvailability(availabilityResult.data.map(rowToAvailabilityWindow));
    }

    if (appointmentsResult.error) {
      console.warn(
        "Unable to load therapist appointments",
        appointmentsResult.error.message,
      );
    } else if (appointmentsResult.data) {
      setAppointments(appointmentsResult.data.map(rowToAppointmentRequest));
    }

    await loadConversations();
  };

  useEffect(() => {
    let isActive = true;

    const restore = async () => {
      setIsHydrated(false);
      setTherapistProfile(null);
      setAvailability([]);
      setAppointments([]);
      setConversations([]);

      if (!isAuthHydrated) return;
      if (!currentUserId) {
        if (isActive) setIsHydrated(true);
        return;
      }

      try {
        await loadAll();
      } catch (error) {
        console.warn("Unable to restore therapist data", error);
      } finally {
        if (isActive) setIsHydrated(true);
      }
    };

    restore();
    return () => {
      isActive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, isAuthHydrated]);

  // Live sync: new booking requests and any client-side changes show up
  // without a manual refresh.
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`appointments-therapist-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `therapist_id=eq.${currentUserId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setAppointments((prev) =>
              prev.filter((a) => a.id !== payload.old.id),
            );
            return;
          }

          const updated = rowToAppointmentRequest(payload.new);
          setAppointments((prev) => {
            const exists = prev.some((a) => a.id === updated.id);
            if (exists) {
              return prev.map((a) => (a.id === updated.id ? updated : a));
            }
            return [updated, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  // Live sync: conversation list updates (new thread, new last message)
  // for whichever side (therapist or client) this account is.
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`therapist-conversations-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "therapist_conversations" },
        () => {
          loadConversations();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, loadConversations]);

  const saveTherapistProfile = async (updates) => {
    const payload = {
      id: currentUserId,
      full_name: updates.fullName,
      photo_url: updates.photoUrl,
      specialty: updates.specialty,
      bio: updates.bio,
      credentials: updates.credentials,
      years_experience: updates.yearsExperience,
      session_types: updates.sessionTypes,
      is_accepting_clients: updates.isAcceptingClients,
    };

    const { data, error } = await supabase
      .from("therapist_profiles")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.warn("Unable to save therapist profile", error.message);
      return null;
    }

    const saved = rowToTherapistProfile(data);
    setTherapistProfile(saved);
    return saved;
  };

  const saveAvailability = async (windows) => {
    const { error: deleteError } = await supabase
      .from("therapist_availability")
      .delete()
      .eq("therapist_id", currentUserId);

    if (deleteError) {
      console.warn("Unable to clear old availability", deleteError.message);
      return false;
    }

    if (windows.length === 0) {
      setAvailability([]);
      return true;
    }

    const rows = windows.map((w) => ({
      therapist_id: currentUserId,
      day_of_week: w.dayOfWeek,
      start_time: w.startTime,
      end_time: w.endTime,
      slot_minutes: w.slotMinutes || 60,
    }));

    const { data, error } = await supabase
      .from("therapist_availability")
      .insert(rows)
      .select();

    if (error) {
      console.warn("Unable to save availability", error.message);
      return false;
    }

    setAvailability(data.map(rowToAvailabilityWindow));
    return true;
  };

  const respondToAppointment = async (appointmentId, { status, declineReason }) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId ? { ...a, status, declineReason } : a,
      ),
    );

    const { error } = await supabase
      .from("appointments")
      .update({ status, decline_reason: declineReason || null })
      .eq("id", appointmentId)
      .eq("therapist_id", currentUserId);

    if (error) {
      console.warn("Unable to update appointment", error.message);
      return false;
    }
    return true;
  };

  const rescheduleAppointment = async (appointmentId, nextDate, nextTime) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointmentId
          ? { ...a, date: nextDate || a.date, time: nextTime || a.time }
          : a,
      ),
    );

    const updatePayload = {};
    if (nextDate) updatePayload.date = nextDate;
    if (nextTime) updatePayload.time = nextTime;

    const { error } = await supabase
      .from("appointments")
      .update(updatePayload)
      .eq("id", appointmentId)
      .eq("therapist_id", currentUserId);

    if (error) {
      console.warn("Unable to reschedule appointment", error.message);
      return false;
    }
    return true;
  };

  // --- Messaging ---

  const getOrCreateConversation = async ({
    therapistId,
    clientId,
    therapistDisplayName,
    clientDisplayName,
  }) => {
    const existing = conversations.find(
      (c) => c.therapistId === therapistId && c.clientId === clientId,
    );
    if (existing) return existing.id;

    const { data, error } = await supabase
      .from("therapist_conversations")
      .upsert(
        {
          therapist_id: therapistId,
          client_id: clientId,
          therapist_display_name: therapistDisplayName || "Therapist",
          client_display_name: clientDisplayName || "Client",
        },
        { onConflict: "therapist_id,client_id" },
      )
      .select()
      .single();

    if (error) {
      console.warn("Unable to start conversation", error.message);
      return null;
    }

    await loadConversations();
    return data.id;
  };

  const loadConversationMessages = useCallback(
    async (conversationId) => {
      if (!conversationId) return;

      const { data, error } = await supabase
        .from("therapist_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.warn("Unable to load messages", error.message);
      } else {
        setActiveMessages((data || []).map((row) => rowToMessage(row, currentUserId)));
      }

      setActiveConversationId(conversationId);

      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current);
      }

      messageChannelRef.current = supabase
        .channel(`therapist-messages-${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "therapist_messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const incoming = rowToMessage(payload.new, currentUserId);
            setActiveMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;
              return [...prev, incoming];
            });
          },
        )
        .subscribe();
    },
    [currentUserId],
  );

  const leaveConversation = useCallback(() => {
    if (messageChannelRef.current) {
      supabase.removeChannel(messageChannelRef.current);
      messageChannelRef.current = null;
    }
    setActiveConversationId(null);
    setActiveMessages([]);
  }, []);

  const sendConversationMessage = async (conversationId, text) => {
    const trimmed = text.trim();
    if (!trimmed || !currentUserId) return null;

    const { data, error } = await supabase
      .from("therapist_messages")
      .insert({ conversation_id: conversationId, sender_id: currentUserId, content: trimmed })
      .select()
      .single();

    if (error) {
      console.warn("Unable to send message", error.message);
      return null;
    }

    await supabase
      .from("therapist_conversations")
      .update({
        last_message_at: data.created_at,
        last_message_preview: trimmed.slice(0, 120),
      })
      .eq("id", conversationId);

    const sent = rowToMessage(data, currentUserId);
    setActiveMessages((prev) => {
      if (prev.some((m) => m.id === sent.id)) return prev;
      return [...prev, sent];
    });
    return sent;
  };

  // --- Derived dashboard data ---

  const pendingRequests = appointments.filter((a) => a.status === "Pending");
  const confirmedAppointments = appointments.filter(
    (a) => a.status === "Confirmed",
  );
  const todaysSessions = confirmedAppointments.filter((a) => a.date === todayIso());
  const upcomingSorted = [...confirmedAppointments].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.time.localeCompare(b.time);
  });
  const nextSession =
    upcomingSorted.find((a) => a.date >= todayIso()) || upcomingSorted[0] || null;

  const clients = useMemo(() => {
    const byClient = new Map();
    appointments.forEach((a) => {
      if (!byClient.has(a.clientId)) {
        byClient.set(a.clientId, {
          clientId: a.clientId,
          name: a.clientDisplayName,
          sessionCount: 0,
          lastDate: a.date,
        });
      }
      const entry = byClient.get(a.clientId);
      entry.sessionCount += 1;
      if (a.date > entry.lastDate) entry.lastDate = a.date;
    });
    return Array.from(byClient.values()).sort((a, b) =>
      a.lastDate < b.lastDate ? 1 : -1,
    );
  }, [appointments]);

  const value = useMemo(
    () => ({
      therapistProfile,
      availability,
      appointments,
      pendingRequests,
      confirmedAppointments,
      todaysSessions,
      nextSession,
      clients,
      conversations,
      activeConversationId,
      activeMessages,
      isHydrated,
      hasCompletedProfile: Boolean(therapistProfile?.fullName),
      saveTherapistProfile,
      saveAvailability,
      respondToAppointment,
      rescheduleAppointment,
      getOrCreateConversation,
      loadConversationMessages,
      leaveConversation,
      sendConversationMessage,
      refresh: loadAll,
    }),
    [
      therapistProfile,
      availability,
      appointments,
      pendingRequests,
      confirmedAppointments,
      todaysSessions,
      nextSession,
      clients,
      conversations,
      activeConversationId,
      activeMessages,
      isHydrated,
      currentUserId,
    ],
  );

  return (
    <TherapistContext.Provider value={value}>
      {children}
    </TherapistContext.Provider>
  );
}

export function useTherapist() {
  const value = useContext(TherapistContext);
  if (!value) {
    throw new Error("useTherapist must be used within TherapistProvider");
  }
  return value;
}

export { DAY_NAMES };
