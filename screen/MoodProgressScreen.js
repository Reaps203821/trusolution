import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWellness } from "../context/WellnessContext";

const scoreToLabel = (score) => {
  if (score <= 1.6) return "Stable";
  if (score <= 2.6) return "Balanced";
  if (score <= 3.4) return "Elevated";
  return "High stress";
};

export default function MoodProgressScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { moodEntries } = useWellness();

  const { analytics, weeklyData, recentEntries } = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return date;
    });

    const week = days.map((date) => {
      const dateKey = date.toISOString().slice(0, 10);
      const entriesForDay = moodEntries.filter(
        (entry) => entry.createdAt.slice(0, 10) === dateKey,
      );
      const value = entriesForDay.length
        ? entriesForDay.reduce((sum, entry) => sum + entry.severity + 1, 0) /
          entriesForDay.length
        : 0;
      return { day: date.toLocaleDateString(undefined, { weekday: "short" }), value };
    });

    const scores = week.filter((item) => item.value > 0).map((item) => item.value);
    if (!scores.length) {
      return {
        weeklyData: week,
        recentEntries: [],
        analytics: null,
      };
    }
    const avg = scores.reduce((sum, item) => sum + item, 0) / scores.length;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const last = scores[scores.length - 1];
    const first = scores[0];
    const delta = last - first;
    const checkInRate = Math.round((scores.length / 7) * 100);
    const stability = Math.max(0, Math.round(100 - (max - min) * 20));

    return {
      weeklyData: week,
      recentEntries: moodEntries.slice(0, 5),
      analytics: { avg, max, min, delta, checkInRate, stability, stateLabel: scoreToLabel(avg) },
    };
  }, [moodEntries]);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 10 },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="#3D2B1F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mood Progress</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroKicker}>Behavioral Analytics</Text>
          <Text style={styles.heroTitle}>Emotional Trend Dashboard</Text>
          <Text style={styles.heroText}>
            {analytics
              ? `Your recent check-ins are ${analytics.stateLabel.toLowerCase()} based on the intensity you recorded.`
              : "Save a mood check-in to begin building your private trend."}
          </Text>
          {analytics ? <View style={styles.heroInlineStats}>
            <View style={styles.inlineStatPill}>
              <Text style={styles.inlineStatLabel}>Avg Index</Text>
              <Text style={styles.inlineStatValue}>{analytics.avg.toFixed(1)}/5</Text>
            </View>
            <View style={styles.inlineStatPill}>
              <Text style={styles.inlineStatLabel}>Stability</Text>
              <Text style={styles.inlineStatValue}>{analytics.stability}%</Text>
            </View>
          </View> : null}
        </View>

        {analytics ? <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Check-in rate</Text>
            <Text style={styles.kpiValue}>{analytics.checkInRate}%</Text>
            <Text style={styles.kpiSub}>Last 7 days</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Weekly delta</Text>
            <Text style={styles.kpiValue}>{analytics.delta >= 0 ? "+" : ""}{analytics.delta.toFixed(1)}</Text>
            <Text style={styles.kpiSub}>{analytics.delta >= 0 ? "Upward stress" : "Downward stress"}</Text>
          </View>
        </View> : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Technical trend (0-5)</Text>
          <View style={styles.axisRow}>
            <View style={styles.yAxis}>
              {[5, 4, 3, 2, 1].map((mark) => (
                <Text key={mark} style={styles.axisLabel}>{mark}</Text>
              ))}
            </View>

            <View style={styles.chartArea}>
              {[5, 4, 3, 2, 1].map((mark) => (
                <View key={mark} style={styles.gridLine} />
              ))}
              <View style={styles.barRow}>
                {weeklyData.map((item) => (
                  <View key={`${item.day}-${item.value}`} style={styles.barWrap}>
                    <View style={[styles.bar, { height: item.value ? 16 + item.value * 24 : 4 }]} />
                    <Text style={styles.barDay}>{item.day}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.legendRow}>
            <Text style={styles.legendText}>Min: {analytics ? analytics.min.toFixed(1) : "—"}</Text>
            <Text style={styles.legendText}>Max: {analytics ? analytics.max.toFixed(1) : "—"}</Text>
            <Text style={styles.legendText}>Avg: {analytics ? analytics.avg.toFixed(1) : "—"}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent check-ins</Text>
          {recentEntries.length ? recentEntries.map((entry) => (
            <View key={entry.id} style={styles.entryRow}>
              <Text style={styles.entryMood}>
                {entry.moodEmoji} {entry.moodLabel}
              </Text>
              <Text style={styles.entryLevel}>{entry.severityLabel}</Text>
              <Text style={styles.entryScore}>{entry.severity + 1}.0</Text>
              <Text style={styles.entryDate}>{new Date(entry.createdAt).toLocaleDateString()}</Text>
            </View>
          )) : <Text style={styles.insightText}>No check-ins yet. Your entries will appear here after you save them.</Text>}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Gentle insight</Text>
          <Text style={styles.insightText}>
            {analytics
              ? "This view helps you notice patterns, not diagnose your mental health. If a feeling becomes overwhelming, consider reaching out to someone you trust or a qualified professional."
              : "Regular check-ins can help you notice what affects your wellbeing over time."}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate("MainTabs", { screen: "Home" })}
        >
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF8EE",
    borderWidth: 1,
    borderColor: "#ECD8C1",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    color: "#3D2B1F",
  },
  headerSpacer: {
    width: 40,
  },
  heroCard: {
    backgroundColor: "#7A4B2F",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  heroKicker: {
    color: "#E7C9B7",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: 7,
  },
  heroTitle: {
    color: "#FFF9F3",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  heroText: {
    color: "#F7E2D6",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  heroInlineStats: {
    flexDirection: "row",
    gap: 10,
  },
  inlineStatPill: {
    flex: 1,
    backgroundColor: "#8B5A3C",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  inlineStatLabel: {
    color: "#E7C9B7",
    fontSize: 11,
    marginBottom: 3,
  },
  inlineStatValue: {
    color: "#FFF9F3",
    fontSize: 15,
    fontWeight: "800",
  },
  kpiRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#FFF8EE",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#ECD8C1",
  },
  kpiTitle: {
    fontSize: 12,
    color: "#8A6A57",
    marginBottom: 6,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#3D2B1F",
    marginBottom: 2,
  },
  kpiSub: {
    fontSize: 12,
    color: "#7A4B2F",
    fontWeight: "700",
  },
  sectionCard: {
    backgroundColor: "#FFF8EE",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#ECD8C1",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#3D2B1F",
    marginBottom: 12,
  },
  axisRow: {
    flexDirection: "row",
  },
  yAxis: {
    width: 22,
    justifyContent: "space-between",
    paddingBottom: 22,
    paddingTop: 4,
  },
  axisLabel: {
    fontSize: 10,
    color: "#8A6A57",
    textAlign: "center",
  },
  chartArea: {
    flex: 1,
    position: "relative",
    paddingHorizontal: 4,
  },
  gridLine: {
    position: "relative",
    height: 1,
    backgroundColor: "#EFE0D0",
    marginBottom: 24,
  },
  barRow: {
    position: "absolute",
    left: 4,
    right: 4,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  barWrap: {
    width: 32,
    alignItems: "center",
  },
  bar: {
    width: 16,
    borderRadius: 8,
    backgroundColor: "#7A4B2F",
    marginBottom: 7,
  },
  barDay: {
    fontSize: 11,
    color: "#8A6A57",
    fontWeight: "700",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  legendText: {
    fontSize: 11,
    color: "#8A6A57",
    fontWeight: "700",
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0E0CF",
  },
  entryMood: {
    flex: 1.3,
    fontSize: 14,
    fontWeight: "700",
    color: "#3D2B1F",
  },
  entryLevel: {
    flex: 1,
    fontSize: 12,
    color: "#7A4B2F",
    fontWeight: "700",
    textAlign: "center",
  },
  entryScore: {
    flex: 0.7,
    fontSize: 12,
    color: "#3D2B1F",
    fontWeight: "800",
    textAlign: "center",
  },
  entryDate: {
    flex: 1,
    fontSize: 12,
    color: "#8A6A57",
    textAlign: "right",
  },
  insightText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#6E5444",
  },
  homeButton: {
    backgroundColor: "#7A4B2F",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  homeButtonText: {
    color: "#FFF9F3",
    fontSize: 15,
    fontWeight: "800",
  },
});
