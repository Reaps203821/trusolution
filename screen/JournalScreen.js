import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const moodEmojis = [
  { id: "great", emoji: "\u{1F929}", label: "Great" },
  { id: "good", emoji: "\u{1F60A}", label: "Good" },
  { id: "okay", emoji: "\u{1F642}", label: "Okay" },
  { id: "low", emoji: "\u{1F614}", label: "Low" },
  { id: "rough", emoji: "\u{1F622}", label: "Rough" },
];

const prompts = [
  "What are you grateful for today?",
  "Describe a moment that made you smile.",
  "What's something you learned about yourself?",
  "What's one challenge you're facing right now?",
  "Write about a goal you're working toward.",
];

export default function JournalScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState([]);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [entryText, setEntryText] = useState("");
  const [selectedMood, setSelectedMood] = useState(null);
  const [currentPrompt, setCurrentPrompt] = useState(
    prompts[Math.floor(Math.random() * prompts.length)],
  );

  const handleSaveEntry = () => {
    if (!entryText.trim()) {
      Alert.alert("Empty Entry", "Please write something before saving.");
      return;
    }

    const newEntry = {
      id: Date.now().toString(),
      text: entryText.trim(),
      mood: selectedMood,
      date: new Date().toISOString(),
      prompt: currentPrompt,
    };

    setEntries((prev) => [newEntry, ...prev]);
    setEntryText("");
    setSelectedMood(null);
    setShowNewEntry(false);
    setCurrentPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
    Alert.alert("Saved!", "Your journal entry has been saved.");
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getMoodEmoji = (moodId) => {
    const mood = moodEmojis.find((m) => m.id === moodId);
    return mood ? mood.emoji : "";
  };

  const deleteEntry = (entryId) => {
    Alert.alert("Delete Entry", "Are you sure you want to delete this entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          setEntries((prev) => prev.filter((e) => e.id !== entryId)),
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
          <Text style={styles.headerTitle}>My Journal</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Ionicons name="book" size={16} color="#256D3C" />
            <Text style={styles.heroBadgeText}>
              {entries.length} entr{entries.length === 1 ? "y" : "ies"}
            </Text>
          </View>
          <Text style={styles.heroTitle}>Private Diary</Text>
          <Text style={styles.heroSubtitle}>
            Your thoughts are private and stored locally on this device.
          </Text>
        </View>

        {!showNewEntry ? (
          <TouchableOpacity
            style={styles.newEntryButton}
            onPress={() => setShowNewEntry(true)}
          >
            <Ionicons name="add-circle" size={24} color="#FFF9F3" />
            <Text style={styles.newEntryText}>New Journal Entry</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.entryForm}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>New Entry</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowNewEntry(false);
                  setEntryText("");
                  setSelectedMood(null);
                }}
              >
                <Ionicons name="close" size={24} color="#8A6A57" />
              </TouchableOpacity>
            </View>

            <View style={styles.promptCard}>
              <Ionicons name="bulb-outline" size={18} color="#7A4B2F" />
              <Text style={styles.promptText}>{currentPrompt}</Text>
            </View>

            <View style={styles.moodSelector}>
              <Text style={styles.moodLabel}>How are you feeling?</Text>
              <View style={styles.moodRow}>
                {moodEmojis.map((mood) => (
                  <TouchableOpacity
                    key={mood.id}
                    style={[
                      styles.moodChip,
                      selectedMood === mood.id && styles.moodChipActive,
                    ]}
                    onPress={() => setSelectedMood(mood.id)}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={styles.textArea}
              placeholder="Start writing your thoughts..."
              placeholderTextColor="#8A6A57"
              value={entryText}
              onChangeText={setEntryText}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.saveButton,
                !entryText.trim() && styles.saveButtonDisabled,
              ]}
              onPress={handleSaveEntry}
              disabled={!entryText.trim()}
            >
              <Text style={styles.saveButtonText}>Save Entry</Text>
            </TouchableOpacity>
          </View>
        )}

        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="journal-outline" size={52} color="#A67C5B" />
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptyText}>
              Your private journal is ready. Tap "New Journal Entry" to write
              your first entry.
            </Text>
          </View>
        ) : (
          entries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              style={styles.entryCard}
              onLongPress={() => deleteEntry(entry.id)}
              activeOpacity={0.92}
            >
              <View style={styles.entryHeader}>
                <View style={styles.entryDateRow}>
                  <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                  {entry.mood && (
                    <Text style={styles.entryMood}>
                      {getMoodEmoji(entry.mood)}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => deleteEntry(entry.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={16} color="#B24A3A" />
                </TouchableOpacity>
              </View>
              {entry.prompt ? (
                <Text style={styles.entryPrompt}>{entry.prompt}</Text>
              ) : null}
              <Text style={styles.entryText} numberOfLines={6}>
                {entry.text}
              </Text>
            </TouchableOpacity>
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
  newEntryButton: {
    backgroundColor: "#7A4B2F",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 18,
  },
  newEntryText: {
    color: "#FFF9F3",
    fontSize: 16,
    fontWeight: "800",
  },
  entryForm: {
    backgroundColor: "#FFF8EE",
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#ECD8C1",
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#3D2B1F",
  },
  promptCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F7EBDD",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  promptText: {
    flex: 1,
    fontSize: 14,
    color: "#6E5444",
    lineHeight: 20,
    fontStyle: "italic",
  },
  moodSelector: {
    marginBottom: 14,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3D2B1F",
    marginBottom: 8,
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  moodChip: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F9F1E5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  moodChipActive: {
    borderColor: "#7A4B2F",
    backgroundColor: "#FFF8EE",
  },
  moodEmoji: {
    fontSize: 24,
  },
  textArea: {
    backgroundColor: "#F9F1E5",
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    color: "#3D2B1F",
    minHeight: 140,
    borderWidth: 1,
    borderColor: "#ECD8C1",
    marginBottom: 14,
  },
  saveButton: {
    backgroundColor: "#3D2B1F",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#B8A583",
  },
  saveButtonText: {
    color: "#FFF9F3",
    fontSize: 15,
    fontWeight: "800",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#3D2B1F",
    marginTop: 14,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#8A6A57",
    textAlign: "center",
  },
  entryCard: {
    backgroundColor: "#FFF8EE",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ECD8C1",
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  entryDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  entryDate: {
    fontSize: 12,
    color: "#8A6A57",
    fontWeight: "600",
  },
  entryMood: {
    fontSize: 16,
  },
  entryPrompt: {
    fontSize: 12,
    color: "#7A4B2F",
    fontStyle: "italic",
    marginBottom: 6,
  },
  entryText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#3D2B1F",
  },
});
