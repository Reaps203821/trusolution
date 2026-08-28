import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "@trusolution/community-posts-v1";
const CommunityContext = createContext(null);

const starterPosts = [
  {
    id: "post-1",
    author: "Ada",
    isAnonymous: false,
    title: "A small win today",
    experience:
      "I finally took a short walk after staying indoors for days. It felt small, but I am proud of it.",
    topics: ["Self-care", "Motivation"],
    createdAt: "Community starter",
    liked: false,
    likes: 18,
    reaction: null,
    comments: [
      {
        id: "comment-1",
        author: "Mira",
        text: "That is a real win. Small steps count.",
      },
    ],
  },
  {
    id: "post-2",
    author: "Anonymous",
    isAnonymous: true,
    title: "Trying to manage stress better",
    experience:
      "Work has been heavy lately, but I am learning to pause before I spiral. Breathing exercises helped this week.",
    topics: ["Stress", "Work"],
    createdAt: "Community starter",
    liked: true,
    likes: 27,
    reaction: "support",
    comments: [
      {
        id: "comment-2",
        author: "Jay",
        text: "Thanks for sharing this. Needed the reminder.",
      },
      {
        id: "comment-3",
        author: "Nora",
        text: "Breathing exercises help me too.",
      },
    ],
  },
];

export function CommunityProvider({ children }) {
  const [posts, setPosts] = useState(starterPosts);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPosts(parsed);
          }
        }
      } catch (error) {
        console.warn("Unable to restore community posts", error);
      } finally {
        setIsHydrated(true);
      }
    };
    restore();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(posts)).catch((e) =>
      console.warn("Unable to save community posts", e),
    );
  }, [isHydrated, posts]);

  const addPost = ({ title, experience, topics, isAnonymous }) => {
    const newPost = {
      id: `post-${Date.now()}`,
      author: isAnonymous ? "Anonymous" : "You",
      isAnonymous,
      title: title.trim(),
      experience: experience.trim(),
      topics,
      createdAt: "Just now",
      liked: false,
      likes: 0,
      reaction: null,
      comments: [],
    };

    setPosts((prev) => [newPost, ...prev]);
    return newPost;
  };

  const toggleLike = (postId) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? Math.max(0, post.likes - 1) : post.likes + 1,
            }
          : post,
      ),
    );
  };

  const setReaction = (postId, reaction) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, reaction } : post)),
    );
  };

  const addComment = (postId, text) => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      return;
    }

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                {
                  id: `comment-${Date.now()}`,
                  author: "You",
                  text: trimmedText,
                },
              ],
            }
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
    [posts, isHydrated],
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
