import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

// A pool of realistic peer matches so each search can surface a peer.
const peerPool = [
  { name: "Alex", topic: "Anxiety Support" },
  { name: "Jordan", topic: "Stress & Work" },
  { name: "Sam", topic: "Relationship Advice" },
  { name: "Riley", topic: "Grief & Loss" },
  { name: "Casey", topic: "Self-esteem" },
  { name: "Taylor", topic: "Family Matters" },
];

const buildConversationId = (peerName, topics) => {
  const topicKey = (topics[0] || "peer").replace(/\s+/g, "-").toLowerCase();
  return `peer-${peerName.toLowerCase()}-${topicKey}`;
};

export default function SearchingScreen({ route }) {
  const insets = useSafeAreaInsets();
  const { selectedTopics = [], conversationStyle = "Both" } =
    route.params || {};
  const navigation = useNavigation();
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const [peer, setPeer] = useState(null);
  const navigatedRef = useRef(false);

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.3,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();

    // Simulate a real search: pick a match after a short delay, then
    // automatically open the chat.
    const searchTimer = setTimeout(() => {
      const randomPeer = peerPool[Math.floor(Math.random() * peerPool.length)];
      setPeer(randomPeer);
    }, 1800);

    return () => clearTimeout(searchTimer);
  }, []);

  // Auto-transition to chat once a peer is found.
  useEffect(() => {
    if (!peer || navigatedRef.current) {
      return;
    }
    navigatedRef.current = true;
    const conversationId = buildConversationId(peer.name, selectedTopics);
    const peerName = `${peer.name} (${peer.topic})`;
    navigation.replace("PeerChat", {
      peerName,
      conversationId,
      conversationStyle,
      selectedTopics,
      chatType: "peer",
    });
  }, [peer, navigation, conversationStyle, selectedTopics]);

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const cancelSearch = () => {
    navigation.goBack();
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <Animated.View
        style={[
          styles.loaderContainer,
          {
            transform: [{ rotate: rotation }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.loaderDot,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        />
        <View style={styles.loaderRing} />
      </Animated.View>

      <Text style={styles.title}>FINDING THE RIGHT PERSON FOR YOU</Text>

      {selectedTopics.length > 0 && (
        <View style={styles.topicsContainer}>
          <Text style={styles.subtitle}>Looking for peers matching:</Text>
          <View style={styles.topicsList}>
            {selectedTopics.slice(0, 3).map((topic, index) => (
              <View key={index} style={styles.topicChip}>
                <Text style={styles.topicChipText}>{topic}</Text>
              </View>
            ))}
            {selectedTopics.length > 3 && (
              <Text style={styles.moreTopics}>
                +{selectedTopics.length - 3} more
              </Text>
            )}
          </View>
        </View>
      )}

      <Text style={styles.subtitle}>
        {conversationStyle} style {"\u2022"} Checking available peers
      </Text>

      {peer && (
        <View style={styles.matchNotice}>
          <Text style={styles.matchNoticeText}>
            Match found: {peer.name} ({peer.topic})
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.cancelBtn} onPress={cancelSearch}>
        <Text style={styles.cancelText}>Cancel Search</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5E6CB",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  loaderContainer: {
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
    position: "relative",
  },
  loaderDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#6B3A24",
    position: "absolute",
    zIndex: 2,
  },
  loaderRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderTopColor: "#6B3A24",
    borderRightColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
    position: "absolute",
    zIndex: 1,
  },
  title: {
    fontWeight: "bold",
    fontSize: 20,
    textAlign: "center",
    color: "#6B3A24",
    marginTop: 40,
  },
  subtitle: {
    color: "#8B7355",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 22,
    maxWidth: 300,
  },
  topicsContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  topicsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 8,
  },
  topicChip: {
    backgroundColor: "#F7EBDD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D4B87A",
  },
  topicChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B3A24",
  },
  moreTopics: {
    color: "#8B7355",
    fontSize: 13,
    marginLeft: 8,
  },
  matchNotice: {
    backgroundColor: "#E7F4E1",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#256D3C",
    marginTop: 10,
  },
  matchNoticeText: {
    color: "#256D3C",
    fontWeight: "700",
    fontSize: 14,
  },
  cancelBtn: {
    backgroundColor: "#F7EBDD",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#6B3A24",
    marginBottom: 40,
  },
  cancelText: {
    color: "#6B3A24",
    fontWeight: "bold",
    fontSize: 16,
  },
});
