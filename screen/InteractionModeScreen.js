import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCommunity } from "../context/CommunityContext";
import { hapticLight } from "../lib/haptics";

const reactions = [
  { id: "support", emoji: "🤍", label: "Support" },
  { id: "relate", emoji: "🙏", label: "Relate" },
  { id: "hug", emoji: "🤗", label: "Hug" },
];

const formatRelativeTime = (isoString) => {
  if (!isoString) return "";
  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return "";
  const diffSeconds = Math.max(0, Math.floor((Date.now() - then) / 1000));

  if (diffSeconds < 60) return "Just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(isoString).toLocaleDateString();
};

function FeedCard({ post, onLike, onReaction, onComment, onReport }) {
  const [commentText, setCommentText] = useState(""); 
  const [showComments, setShowComments] = useState(false);

  const submitComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) {
      return;
    }
    onComment(trimmed);
    setCommentText("");
    setShowComments(true);
  };

  const handleReportPress = () => {
    Alert.alert(
      "Report this post?",
      "We'll review it for anything that goes against community guidelines.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: () => onReport(),
        },
      ],
    );
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{post.author.charAt(0)}</Text>
        </View>
        <View style={styles.postMeta}>
          <Text style={styles.authorName}>{post.author}</Text>
          <Text style={styles.postTime}>{formatRelativeTime(post.createdAt)}</Text>
        </View>
        <TouchableOpacity
          onPress={handleReportPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="flag-outline" size={18} color="#8A7963" />
        </TouchableOpacity>
      </View>

      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postBody}>{post.experience}</Text>

      <View style={styles.tagRow}>
        {post.topics.map((topic) => (
          <View key={topic} style={styles.tag}>
            <Text style={styles.tagText}>#{topic}</Text>
          </View>
        ))}
      </View>

      <View style={styles.postStats}>
        <Text style={styles.statText}>{post.likes} likes</Text>
        <Text style={styles.statText}>{post.comments.length} comments</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={onLike}>
          <Ionicons
            name={post.liked ? "heart" : "heart-outline"}
            size={18}
            color={post.liked ? "#B24A3A" : "#6A5845"}
          />
          <Text style={[styles.actionText, post.liked && styles.likedText]}>
            Like
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowComments((prev) => !prev)}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#6A5845" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.reactionRow}>
        {reactions.map((reaction) => {
          const selected = post.reaction === reaction.id;
          return (
            <TouchableOpacity
              key={reaction.id}
              style={[
                styles.reactionChip,
                selected && styles.reactionChipActive,
              ]}
              onPress={() => onReaction(reaction.id)}
            >
              <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
              <Text
                style={[
                  styles.reactionLabel,
                  selected && styles.reactionLabelActive,
                ]}
              >
                {reaction.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.commentComposer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a kind comment..."
          placeholderTextColor="#8A7963"
          value={commentText}
          onChangeText={setCommentText}
        />
        <TouchableOpacity style={styles.commentSend} onPress={submitComment}>
          <Ionicons name="send" size={16} color="#FFF8EC" />
        </TouchableOpacity>
      </View>

      {showComments && post.comments.length > 0 && (
        <View style={styles.commentList}>
          {post.comments.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <Text style={styles.commentAuthor}>{comment.author}</Text>
              <Text style={styles.commentText}>{comment.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function InteractionModeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { posts, isHydrated, toggleLike, setReaction, addComment, reportPost } =
    useCommunity();

  const handleReport = async (postId) => {
    const ok = await reportPost(postId);
    if (ok) {
      Alert.alert("Thanks", "We've received your report and will take a look.");
    } else {
      Alert.alert("Something went wrong", "Please try again.");
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 70 },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Community Feed</Text>
            <Text style={styles.subtitle}>
              Shared experiences from people using the app
            </Text>
          </View>
          <TouchableOpacity
            style={styles.newPostButton}
            onPress={() => navigation.navigate("ShareExperience")}
          >
            <Ionicons name="add" size={22} color="#FFF9F3" />
          </TouchableOpacity>
        </View>

<View style={styles.feedIntro}>
          <Ionicons name="sparkles-outline" size={20} color="#7A4B2F" />
          <Text style={styles.feedIntroText}>
            Shared experiences from people in the community appear here. Be kind
            and supportive.
          </Text>
        </View>

        {!isHydrated ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color="#7A4B2F" />
            <Text style={styles.loadingText}>Loading the feed...</Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color="#A67C5B" />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>
              Be the first to share something with the community.
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate("ShareExperience")}
            >
              <Ionicons name="add-circle" size={18} color="#FFF9F3" />
              <Text style={styles.emptyStateButtonText}>Share Experience</Text>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map((post) => (
            <FeedCard
              key={post.id}
              post={post}
              onLike={() => {
                hapticLight();
                toggleLike(post.id);
              }}
              onReaction={(reaction) => setReaction(post.id, reaction)}
              onComment={(text) => addComment(post.id, text)}
              onReport={() => handleReport(post.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5E6CB",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  loadingState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: "#8A6A57",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#3D2B1F",
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#8A6A57",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  newPostButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#7A4B2F",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#4A2C1E",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#7A614F",
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#7A4B2F",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 16,
  },
  emptyStateButtonText: {
    color: "#FFF9F3",
    fontSize: 14,
    fontWeight: "800",
  },
  feedIntro: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6ECD2",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  feedIntroText: {
    flex: 1,
    color: "#6A5845",
    fontSize: 13,
    lineHeight: 18,
  },
  postCard: {
    backgroundColor: "#FBF6E8",
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E3D3B0",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#7A4B2F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#FFF8EC",
    fontWeight: "800",
    fontSize: 16,
  },
  postMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#4A2C1E",
  },
  postTime: {
    fontSize: 12,
    color: "#8A7963",
    marginTop: 2,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#4A2C1E",
    marginBottom: 8,
  },
  postBody: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5E4B39",
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: "#F1E2B8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  tagText: {
    color: "#6A4D36",
    fontSize: 12,
    fontWeight: "700",
  },
  postStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statText: {
    fontSize: 12,
    color: "#8A7963",
  },
  actionRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F4E8CA",
    borderRadius: 14,
  },
  actionText: {
    color: "#6A5845",
    fontWeight: "700",
  },
  likedText: {
    color: "#B24A3A",
  },
  reactionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  reactionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E3D3B0",
    backgroundColor: "#FFF8EC",
  },
  reactionChipActive: {
    backgroundColor: "#7A4B2F",
    borderColor: "#7A4B2F",
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionLabel: {
    color: "#6A5845",
    fontWeight: "700",
    fontSize: 12,
  },
  reactionLabelActive: {
    color: "#FFF8EC",
  },
  commentComposer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4E8CA",
    borderRadius: 18,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: "#4A2C1E",
    paddingVertical: 8,
  },
  commentSend: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#7A4B2F",
    alignItems: "center",
    justifyContent: "center",
  },
  commentList: {
    marginTop: 12,
    gap: 8,
  },
  commentItem: {
    backgroundColor: "#F8EED9",
    padding: 10,
    borderRadius: 14,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6A4D36",
    marginBottom: 4,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#5E4B39",
  },
});
