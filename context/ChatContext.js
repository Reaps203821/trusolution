import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const ChatContext = createContext(null);

const formatTime = (isoString) =>
  new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const buildRating = (session) => {
  if (!session.rating) return null;
  return {
    rating: session.rating,
    feedback: session.feedback,
    peerName: session.peer_name,
    ratedAt: session.rated_at,
  };
};

export function ChatProvider({ children }) {
  const { currentUser, isHydrated: isAuthHydrated } = useAuth();
  const currentUserId = currentUser?.id;

  // conversations: { [conversationKey]: { sessionId, messages, rating, meta } }
  const [conversations, setConversations] = useState({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isActive = true;

    const restore = async () => {
      setIsHydrated(false);
      setConversations({});

      if (!isAuthHydrated) return;
      if (!currentUserId) {
        if (isActive) setIsHydrated(true);
        return;
      }

      try {
        const { data: sessions, error } = await supabase
          .from("chat_sessions")
          .select("*, chat_session_messages(*)")
          .eq("user_id", currentUserId);

        if (!isActive) return;

        if (error) {
          console.warn("Unable to restore chat sessions", error.message);
        } else if (sessions) {
          const next = {};
          sessions.forEach((session) => {
            const messages = (session.chat_session_messages || [])
              .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
              .map((m) => ({
                id: m.id,
                text: m.content,
                sender: m.sender,
                time: formatTime(m.created_at),
              }));

            next[session.conversation_key] = {
              sessionId: session.id,
              messages,
              rating: buildRating(session),
              meta: {
                id: session.conversation_key,
                peerName: session.peer_name,
                chatType: session.chat_type,
                conversationStyle: session.conversation_style,
              },
            };
          });
          setConversations(next);
        }
      } catch (error) {
        console.warn("Unable to restore chat sessions", error);
      } finally {
        if (isActive) setIsHydrated(true);
      }
    };

    restore();
    return () => {
      isActive = false;
    };
  }, [currentUserId, isAuthHydrated]);

  const getConversation = (conversationId) => {
    if (!conversationId) {
      return { messages: [], rating: null, meta: null };
    }
    return (
      conversations[conversationId] || {
        messages: [],
        rating: null,
        meta: null,
      }
    );
  };

  const openConversation = ({ id, peerName, chatType, conversationStyle }) => {
    const existing = conversations[id];
    if (existing) {
      return existing;
    }

    const fresh = {
      sessionId: null,
      messages: [],
      rating: null,
      meta: { id, peerName, chatType, conversationStyle },
    };
    setConversations((prev) => ({ ...prev, [id]: fresh }));

    // Fire-and-forget create the session row so a sessionId exists before
    // the first message is sent.
    (async () => {
      if (!currentUserId) return;
      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: currentUserId,
          conversation_key: id,
          peer_name: peerName,
          chat_type: chatType,
          conversation_style: conversationStyle,
        })
        .select()
        .single();

      if (error) {
        // Might already exist (race/reopen) - fetch it instead.
        const { data: existingRow } = await supabase
          .from("chat_sessions")
          .select("*")
          .eq("user_id", currentUserId)
          .eq("conversation_key", id)
          .maybeSingle();
        if (existingRow) {
          setConversations((prev) => ({
            ...prev,
            [id]: { ...(prev[id] || fresh), sessionId: existingRow.id },
          }));
        } else {
          console.warn("Unable to open conversation", error.message);
        }
        return;
      }

      setConversations((prev) => ({
        ...prev,
        [id]: { ...(prev[id] || fresh), sessionId: data.id },
      }));
    })();

    return fresh;
  };

  const ensureSessionId = async (conversationId) => {
    const existing = conversations[conversationId];
    if (existing?.sessionId) return existing.sessionId;

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", currentUserId)
      .eq("conversation_key", conversationId)
      .maybeSingle();

    if (data) return data.id;

    if (error) {
      console.warn("Unable to look up chat session", error.message);
    }
    return null;
  };

  const addMessage = async (conversationId, { text, sender, time }) => {
    if (!conversationId) return;

    const optimisticMessage = {
      id: `local-${Date.now()}`,
      text,
      sender,
      time,
    };

    setConversations((prev) => {
      const existing = prev[conversationId] || { messages: [], rating: null };
      return {
        ...prev,
        [conversationId]: {
          ...existing,
          messages: [...existing.messages, optimisticMessage],
        },
      };
    });

    const sessionId = await ensureSessionId(conversationId);
    if (!sessionId) return optimisticMessage;

    const { data, error } = await supabase
      .from("chat_session_messages")
      .insert({ session_id: sessionId, sender, content: text })
      .select()
      .single();

    if (error) {
      console.warn("Unable to save message", error.message);
      return optimisticMessage;
    }

    const savedMessage = {
      id: data.id,
      text: data.content,
      sender: data.sender,
      time: formatTime(data.created_at),
    };

    setConversations((prev) => {
      const existing = prev[conversationId] || { messages: [] };
      return {
        ...prev,
        [conversationId]: {
          ...existing,
          sessionId,
          messages: existing.messages.map((m) =>
            m.id === optimisticMessage.id ? savedMessage : m,
          ),
        },
      };
    });

    return savedMessage;
  };

  const addReply = (conversationId, peerName, text) => {
    if (!conversationId) return;
    addMessage(conversationId, {
      text,
      sender: "peer",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
  };

  const rateConversation = async (conversationId, { rating, feedback, peerName }) => {
    if (!conversationId) return;

    const ratedAt = new Date().toISOString();

    setConversations((prev) => {
      const existing = prev[conversationId] || { messages: [] };
      return {
        ...prev,
        [conversationId]: {
          ...existing,
          rating: { rating, feedback, peerName, ratedAt },
        },
      };
    });

    const sessionId = await ensureSessionId(conversationId);
    if (!sessionId) return;

    const { error } = await supabase
      .from("chat_sessions")
      .update({ rating, feedback, rated_at: ratedAt })
      .eq("id", sessionId);

    if (error) {
      console.warn("Unable to save rating", error.message);
    }
  };

  const value = useMemo(
    () => ({
      conversations,
      isHydrated,
      getConversation,
      openConversation,
      addMessage,
      addReply,
      rateConversation,
    }),
    [conversations, isHydrated, currentUserId],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const value = useContext(ChatContext);
  if (!value) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return value;
}
