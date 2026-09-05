import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { fetchConversationSummary } from "../lib/peerMatching";

const ChatContext = createContext(null);

const formatTime = (isoString) =>
  new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const rowToMessage = (row, currentUserId) => ({
  id: row.id,
  text: row.content,
  sender: row.sender_id === currentUserId ? "user" : "peer",
  time: formatTime(row.created_at),
});

export function ChatProvider({ children }) {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id;

  const [activeConversationId, setActiveConversationId] = useState(null);
  const [otherName, setOtherName] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const channelRef = useRef(null);

  const leaveConversation = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setActiveConversationId(null);
    setOtherName("");
    setMessages([]);
  }, []);

  const loadConversation = useCallback(
    async (conversationId) => {
      if (!conversationId || !currentUserId) return;

      setIsLoading(true);

      const summary = await fetchConversationSummary(conversationId, currentUserId);
      if (summary) {
        setOtherName(summary.otherName || "Peer");
      }

      const { data, error } = await supabase
        .from("peer_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.warn("Unable to load messages", error.message);
      } else {
        setMessages((data || []).map((row) => rowToMessage(row, currentUserId)));
      }

      setActiveConversationId(conversationId);
      setIsLoading(false);

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      channelRef.current = supabase
        .channel(`peer-messages-${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "peer_messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const incoming = rowToMessage(payload.new, currentUserId);
            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;
              return [...prev, incoming];
            });
          },
        )
        .subscribe();
    },
    [currentUserId],
  );

  const sendMessage = useCallback(
    async (conversationId, text) => {
      const trimmed = text.trim();
      if (!trimmed || !currentUserId) return null;

      const { data, error } = await supabase
        .from("peer_messages")
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: trimmed,
        })
        .select()
        .single();

      if (error) {
        console.warn("Unable to send message", error.message);
        return null;
      }

      const sent = rowToMessage(data, currentUserId);
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
      return sent;
    },
    [currentUserId],
  );

  const endConversation = useCallback(async (conversationId) => {
    const { error } = await supabase
      .from("peer_conversations")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", conversationId);

    if (error) {
      console.warn("Unable to end conversation", error.message);
      return false;
    }
    return true;
  }, []);

  const rateConversation = useCallback(async (conversationId, { rating, feedback }) => {
    const { error } = await supabase
      .from("peer_conversations")
      .update({ rating, feedback })
      .eq("id", conversationId);

    if (error) {
      console.warn("Unable to save rating", error.message);
      return false;
    }
    return true;
  }, []);

  const reportConversation = useCallback(
    async (conversationId, reason) => {
      const { error } = await supabase.from("peer_chat_reports").insert({
        conversation_id: conversationId,
        reporter_id: currentUserId,
        reason,
      });

      if (error) {
        console.warn("Unable to file report", error.message);
        return false;
      }
      return true;
    },
    [currentUserId],
  );

  const value = useMemo(
    () => ({
      activeConversationId,
      otherName,
      messages,
      isLoading,
      loadConversation,
      leaveConversation,
      sendMessage,
      endConversation,
      rateConversation,
      reportConversation,
    }),
    [
      activeConversationId,
      otherName,
      messages,
      isLoading,
      loadConversation,
      leaveConversation,
      sendMessage,
      endConversation,
      rateConversation,
      reportConversation,
    ],
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
