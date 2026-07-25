import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const categories = ["All", "Anxiety", "Depression", "Self-Care", "Crisis"];

const resources = [
  {
    id: "1",
    title: "Understanding Anxiety Triggers",
    category: "Anxiety",
    summary:
      "Learn to identify what triggers your anxiety and develop coping strategies that work for you.",
    readTime: "5 min read",
    type: "article",
  },
  {
    id: "2",
    title: "Morning Routines for Better Mental Health",
    category: "Self-Care",
    summary:
      "Small morning habits that can set a positive tone for your entire day.",
    readTime: "4 min read",
    type: "article",
  },
  {
    id: "3",
    title: "Signs of Depression & When to Seek Help",
    category: "Depression",
    summary:
      "Recognize the early warning signs and understand when it's time to reach out for support.",
    readTime: "6 min read",
    type: "article",
  },
  {
    id: "4",
    title: "Breathing Exercises for Panic Moments",
    category: "Anxiety",
    summary:
      "Simple breathing techniques to help ground yourself during moments of intense anxiety.",
    readTime: "3 min read",
    type: "exercise",
  },
  {
    id: "5",
    title: "The Power of Journaling for Mental Clarity",
    category: "Self-Care",
    summary:
      "How writing down your thoughts can help process emotions and reduce stress.",
    readTime: "5 min read",
    type: "article",
  },
  {
    id: "6",
    title: "Crisis Helplines & Immediate Support",
    category: "Crisis",
    summary:
      "If you or someone you know needs immediate help, these resources are available 24/7.",
    readTime: "2 min read",
    type: "hotline",
  },
  {
    id: "7",
    title: "Managing Relationship Stress",
    category: "Depression",
    summary:
      "Navigate relationship challenges while protecting your mental wellbeing.",
    readTime: "7 min read",
    type: "article",
  },
  {
    id: "8",
    title: "Gratitude Practice: A Science-Backed Strategy",
    category: "Self-Care",
    summary:
      "Studies show gratitude journaling can improve mood and reduce symptoms of depression.",
    readTime: "4 min read",
    type: "exercise",
  },
];

const hotlines = [
  {
    name: "National Crisis Hotline",
    number: "988",
    description: "24/7 support for mental health crises",
  },
  {
    name: "Crisis Text Line",
    number: "741741",
    description: "Text HOME to connect with a crisis counselor",
  },
  {
    name: "SAMHSA Helpline",
    number: "1-800-662-4357",
    description: "Referral and information service 24/7",
  },
];

export default function ResourceLibraryScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      !searchQuery.trim() ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCallHotline = (number) => {
    Alert.alert("Call " + number + "?", "This will open your phone dialer.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Call",
        onPress: () => Linking.openURL(`tel:${number}`),
      },
    ]);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#3D2B1F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Resource Library</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Ionicons name="library" size={16} color="#256D3C" />
            <Text style={styles.heroBadgeText}>Free resources</Text>
          </View>
          <Text style={styles.heroTitle}>Learn & Grow</Text>
          <Text style={styles.heroSubtitle}>
            Curated articles, exercises, and crisis resources to support your
            mental health journey.
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8A6A57" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search resources..."
            placeholderTextColor="#8A6A57"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#8A6A57" />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesRow}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.crisisBanner}>
          <Ionicons name="shield-checkmark" size={22} color="#FFF9F3" />
          <View style={styles.crisisBannerText}>
            <Text style={styles.crisisBannerTitle}>Need immediate help?</Text>
            <Text style={styles.crisisBannerSub}>
              Crisis resources available 24/7
            </Text>
          </View>
          <TouchableOpacity
            style={styles.crisisButton}
            onPress={() => {
              Alert.alert(
                "Crisis Resources",
                hotlines.map((h) => `${h.name}: ${h.number}`).join("\n\n"),
                [
                  { text: "Close", style: "cancel" },
                  {
                    text: "Call 988",
                    onPress: () => handleCallHotline("988"),
                  },
                ],
              );
            }}
          >
            <Text style={styles.crisisButtonText}>Get Help</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>
          {filteredResources.length} resource
          {filteredResources.length !== 1 ? "s" : ""}
        </Text>

        {filteredResources.map((resource) => (
          <TouchableOpacity
            key={resource.id}
            style={styles.resourceCard}
            activeOpacity={0.92}
            onPress={() => {
              if (resource.type === "hotline") {
                handleCallHotline(hotlines[0].number);
              } else {
                Alert.alert(
                  resource.title,
                  resource.summary +
                    "\n\nThis is a preview. Full article content would be displayed here in production.",
                  [{ text: "OK" }],
                );
              }
            }}
          >
            <View style={styles.resourceTop}>
              <View
                style={[
                  styles.resourceIconWrap,
                  resource.type === "hotline" && styles.hotlineIconWrap,
                  resource.type === "exercise" && styles.exerciseIconWrap,
                ]}
              >
                <Ionicons
                  name={
                    resource.type === "hotline"
                      ? "call"
                      : resource.type === "exercise"
                        ? "fitness"
                        : "book"
                  }
                  size={20}
                  color={
                    resource.type === "hotline"
                      ? "#B24A3A"
                      : resource.type === "exercise"
                        ? "#256D3C"
                        : "#7A4B2F"
                  }
                />
              </View>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceTitle}>{resource.title}</Text>
                <Text style={styles.resourceCategory}>
                  {resource.category} {"\u2022"} {resource.readTime}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8A6A57" />
            </View>
            <Text style={styles.resourceSummary}>{resource.summary}</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.hotlinesSection}>
          <Text style={styles.hotlinesTitle}>Crisis Hotlines</Text>
          {hotlines.map((hotline) => (
            <TouchableOpacity
              key={hotline.number}
              style={styles.hotlineCard}
              onPress={() => handleCallHotline(hotline.number)}
            >
              <View style={styles.hotlineLeft}>
                <Ionicons name="call-outline" size={20} color="#B24A3A" />
                <View>
                  <Text style={styles.hotlineName}>{hotline.name}</Text>
                  <Text style={styles.hotlineDesc}>{hotline.description}</Text>
                </View>
              </View>
              <Text style={styles.hotlineNumber}>{hotline.number}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5E6CB",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7EBDD",
    borderWidth: 1,
    borderColor: "#E4C9A8",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    color: "#3D2B1F",
  },
  headerSpacer: {
    width: 40,
  },
  heroCard: {
    backgroundColor: "#7A4B2F",
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#E7F4E1",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    marginBottom: 12,
  },
  heroBadgeText: {
    color: "#256D3C",
    fontSize: 12,
    fontWeight: "700",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFF9F3",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#F7E2D6",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8EE",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#ECD8C1",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#3D2B1F",
  },
  categoriesRow: {
    marginBottom: 14,
  },
  categoriesContent: {
    gap: 10,
    paddingRight: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F9F1E5",
    borderWidth: 1,
    borderColor: "#E4C9A8",
  },
  categoryChipActive: {
    backgroundColor: "#7A4B2F",
    borderColor: "#7A4B2F",
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6E5444",
  },
  categoryTextActive: {
    color: "#FFF9F3",
  },
  crisisBanner: {
    backgroundColor: "#B24A3A",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  crisisBannerText: {
    flex: 1,
  },
  crisisBannerTitle: {
    color: "#FFF9F3",
    fontSize: 16,
    fontWeight: "800",
  },
  crisisBannerSub: {
    color: "#F7D4CD",
    fontSize: 12,
    marginTop: 2,
  },
  crisisButton: {
    backgroundColor: "rgba(255,249,243,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  crisisButtonText: {
    color: "#FFF9F3",
    fontWeight: "800",
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#3D2B1F",
    marginBottom: 14,
  },
  resourceCard: {
    backgroundColor: "#FFF8EE",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ECD8C1",
  },
  resourceTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  resourceIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F7EBDD",
    alignItems: "center",
    justifyContent: "center",
  },
  hotlineIconWrap: {
    backgroundColor: "#FDECEC",
  },
  exerciseIconWrap: {
    backgroundColor: "#E7F4E1",
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#3D2B1F",
    marginBottom: 2,
  },
  resourceCategory: {
    fontSize: 12,
    color: "#8A6A57",
  },
  resourceSummary: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6E5444",
  },
  hotlinesSection: {
    marginTop: 8,
  },
  hotlinesTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#3D2B1F",
    marginBottom: 12,
  },
  hotlineCard: {
    backgroundColor: "#FFF8EE",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ECD8C1",
  },
  hotlineLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  hotlineName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3D2B1F",
  },
  hotlineDesc: {
    fontSize: 12,
    color: "#8A6A57",
    marginTop: 2,
  },
  hotlineNumber: {
    fontSize: 16,
    fontWeight: "800",
    color: "#B24A3A",
  },
});
