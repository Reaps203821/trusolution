import { supabase } from "./supabase";

// Calls the atomic matching function. Returns a conversation id immediately
// if someone else was already waiting, or null if we're now the one waiting.
export async function requestPeerMatch({ topics, conversationStyle, displayName }) {
  const { data, error } = await supabase.rpc("find_peer_match", {
    p_topics: topics,
    p_conversation_style: conversationStyle,
    p_display_name: displayName,
  });

  if (error) {
    console.warn("Unable to request peer match", error.message);
    return { conversationId: null, error: error.message };
  }

  return { conversationId: data || null, error: null };
}

// Subscribes to the caller's own queue row so we find out the moment
// somebody else's search matches us. Returns an unsubscribe function.
export function subscribeToQueueMatch(userId, onMatched) {
  const channel = supabase
    .channel(`peer-queue-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "peer_queue",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.new.status === "matched" && payload.new.matched_conversation_id) {
          onMatched(payload.new.matched_conversation_id);
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function cancelPeerSearch(userId) {
  const { error } = await supabase.from("peer_queue").delete().eq("user_id", userId);
  if (error) {
    console.warn("Unable to cancel search", error.message);
  }
}

export async function fetchConversationSummary(conversationId, currentUserId) {
  const { data, error } = await supabase
    .from("peer_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !data) {
    console.warn("Unable to load conversation", error?.message);
    return null;
  }

  const otherName =
    data.participant_one === currentUserId
      ? data.participant_two_name
      : data.participant_one_name;

  return { ...data, otherName };
}
