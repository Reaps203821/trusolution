import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { useWellness } from "./WellnessContext";

const CommunityContext = createContext(null);

const commentRowToComment = (row) => ({
  id: row.id,
  author: row.display_name || (row.is_anonymous ? "Anonymous" : "Member"),
  text: row.content,
});

const rowToPost = ({ post, likesForPost, currentUserId }) => {
  const myLikeRow = likesForPost.find((l) => l.user_id === currentUserId);
  return {
    id: post.id,
    author: post.display_name || (post.is_anonymous ? "Anonymous" : "Member"),
    isAnonymous: post.is_anonymous,
    title: post.title || "",
    experience: post.content,
    topics: post.tags || [],
    createdAt: post.created_at,
    liked: Boolean(myLikeRow),
    likes: post.like_count || 0,
    reaction: myLikeRow?.reaction || null,
    comments: (post.community_comments || []).map(commentRowToComment),
    userId: post.user_id,
  };
};

export function CommunityProvider({ children }) {
  const { currentUser, isHydrated: isAuthHydrated } = useAuth();
  const { profile } = useWellness();
  const currentUserId = currentUser?.id;

  const [posts, setPosts] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const loadPosts = async () => {
    const [postsResult, likesResult] = await Promise.all([
      supabase
        .from("community_posts")
        .select("*, community_comments(*)")
        .order("created_at", { ascending: false }),
      currentUserId
        ? supabase
            .from("community_post_likes")
            .select("*")
            .eq("user_id", currentUserId)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (postsResult.error) {
      console.warn("Unable to load community posts", postsResult.error.message);
      return;
    }

    const likes = likesResult.data || [];
    const mapped = (postsResult.data || []).map((post) =>
      rowToPost({
        post,
        likesForPost: likes.filter((l) => l.post_id === post.id),
        currentUserId,
      }),
    );
    setPosts(mapped);
  };

  useEffect(() => {
    let isActive = true;

    const restore = async () => {
      setIsHydrated(false);

      if (!isAuthHydrated) {
        return;
      }

      try {
        await loadPosts();
      } catch (error) {
        console.warn("Unable to restore community posts", error);
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

  const displayName = (isAnonymous) => {
    if (isAnonymous) return "Anonymous";
    return profile?.username || profile?.fullName || "Member";
  };

  const addPost = async ({ title, experience, topics, isAnonymous }) => {
    const { data, error } = await supabase
      .from("community_posts")
      .insert({
        user_id: currentUserId,
        title: title.trim(),
        content: experience.trim(),
        tags: topics || [],
        is_anonymous: isAnonymous,
        display_name: displayName(isAnonymous),
      })
      .select("*, community_comments(*)")
      .single();

    if (error) {
      console.warn("Unable to create post", error.message);
      return null;
    }

    const newPost = rowToPost({ post: data, likesForPost: [], currentUserId });
    setPosts((prev) => [newPost, ...prev]);
    return newPost;
  };

  const toggleLike = async (postId) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const wasLiked = post.liked;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked: !wasLiked,
              likes: wasLiked ? Math.max(0, p.likes - 1) : p.likes + 1,
            }
          : p,
      ),
    );

    if (wasLiked) {
      const { error } = await supabase
        .from("community_post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", currentUserId);
      if (!error) {
        await supabase
          .from("community_posts")
          .update({ like_count: Math.max(0, post.likes - 1) })
          .eq("id", postId);
      } else {
        console.warn("Unable to unlike post", error.message);
      }
    } else {
      const { error } = await supabase
        .from("community_post_likes")
        .insert({ post_id: postId, user_id: currentUserId });
      if (!error) {
        await supabase
          .from("community_posts")
          .update({ like_count: post.likes + 1 })
          .eq("id", postId);
      } else {
        console.warn("Unable to like post", error.message);
      }
    }
  };

  const setReaction = async (postId, reaction) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, reaction } : p)),
    );

    const { error } = await supabase.from("community_post_likes").upsert(
      {
        post_id: postId,
        user_id: currentUserId,
        reaction,
      },
      { onConflict: "post_id,user_id" },
    );

    if (error) {
      console.warn("Unable to save reaction", error.message);
    }
  };

  const addComment = async (postId, text) => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      return;
    }

    const isAnonymous = false;
    const { data, error } = await supabase
      .from("community_comments")
      .insert({
        post_id: postId,
        user_id: currentUserId,
        content: trimmedText,
        is_anonymous: isAnonymous,
        display_name: displayName(isAnonymous),
      })
      .select()
      .single();

    if (error) {
      console.warn("Unable to add comment", error.message);
      return;
    }

    const newComment = commentRowToComment(data);
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, comments: [...post.comments, newComment] }
          : post,
      ),
    );
  };

  const value = useMemo(
    () => ({
      posts,
      isHydrated,
      addPost,
      toggleLike,
      setReaction,
      addComment,
    }),
    [posts, isHydrated, currentUserId],
  );

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  const value = useContext(CommunityContext);
  if (!value) {
    throw new Error("useCommunity must be used within CommunityProvider");
  }
  return value;
}
