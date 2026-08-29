import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWellness } from "../context/WellnessContext";

// Note: these are US-based lines. If you expand beyond the US, resolve this
// list by the user's region instead of hardcoding it.
const HOTLINES = [
  {
    id: "988",
    name: "988 Suicide & Crisis Lifeline",
    description: "Free, confidential support, 24/7.",
    action: "call",
    value: "988",
  },
  {
    id: "crisis-text",
    name: "Crisis Text Line",
    description: "Text HOME to connect with a counselor.",
    action: "sms",
    value: "741741",
    smsBody: "HOME",
  },
  {
    id: "911",
    name: "Emergency Services",
    description: "If you or someone else is in immediate danger.",
    action: "call",
    value: "911",
  },
];

export default function CrisisResourcesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { supportPlan } = useWellness();

  const handleHotline = (item) => {
    if (item.action === "call") {
      Linking.openURL(`tel:${item.value}`);
    } else if (item.action === "sms") {
      Linking.openURL(`sms:${item.value}${item.smsBody ? `&body=${item.smsBody}` : ""}`);
    }
  };

  const handleContact = (contact) => {
    if (contact.phone) {
      Linking.openURL(`tel:${contact.phone}`);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
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
          <Text style={styles.headerTitle}>Crisis Support</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.heroCard}>
          <Ionicons name="heart" size={22} color="#FFF9F3" />
          <Text style={styles.heroTitle}>You don't have to go through this alone</Text>
          <Text style={styles.heroText}>
            If you're in crisis or just need to talk, these are here for you right
            now — free and confidential.
          </Text>
        </View>

        {HOTLINES.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.hotlineCard}
            onPress={() => handleHotline(item)}
          >
            <View style={styles.hotlineIcon}>
              <Ionicons
                name={item.action === "call" ? "call" : "chatbubble"}
                size={20}
                color="#FFF9F3"
              />
            </View>
            <View style={styles.hotlineTextWrap}>
              <Text style={styles.hotlineName}>{item.name}</Text>
              <Text style={styles.hotlineDesc}>{item.description}</Text>
            </View>
            <Text style={styles.hotlineValue}>{item.value}</Text>
          </TouchableOpacity>
        ))}

        {supportPlan.trustedContacts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your trusted contacts</Text>
            {supportPlan.trustedContacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={styles.contactRow}
                onPress={() => handleContact(contact)}
              >
                <View>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                </View>
                <Ionicons name="call-outline" size={20} color="#7A4B2F" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {(supportPlan.warningSigns || supportPlan.copingSteps) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your coping steps</Text>
            {supportPlan.copingSteps ? (
              <Text style={styles.planText}>{supportPlan.copingSteps}</Text>
            ) : (
              <Text style={styles.planEmptyText}>
                You haven't saved coping steps yet.
              </Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("SupportPlan")}
        >
          <Text style={styles.secondaryButtonText}>Edit my full support plan</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5E6CB" },
  content: { padding: 18, paddingBottom: 30 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF8EE",
    borderWidth: 1,
    borderColor: "#ECD8C1",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 21,
    fontWeight: "800",
    color: "#3D2B1F",
  },
  headerSpacer: { width: 40 },
  heroCard: {
    backgroundColor: "#A84B3C",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },
  heroTitle: {
    color: "#FFF9F3",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 6,
  },
  heroText: {
    color: "#FFF3EB",
    fontSize: 13,
    lineHeight: 19,
  },
  hotlineCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8EE",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ECD8C1",
  },
  hotlineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7A4B2F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  hotlineTextWrap: { flex: 1 },
  hotlineName: { fontSize: 14, fontWeight: "800", color: "#3D2B1F" },
  hotlineDesc: { fontSize: 12, color: "#7B6753", marginTop: 2 },
  hotlineValue: { fontSize: 14, fontWeight: "800", color: "#7A4B2F" },
  section: {
    backgroundColor: "#FFF8EE",
    borderRadius: 20,
    padding: 16,
    marginTop: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#ECD8C1",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#3D2B1F",
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  contactName: { fontSize: 14, fontWeight: "700", color: "#3D2B1F" },
  contactPhone: { fontSize: 12, color: "#7B6753", marginTop: 2 },
  planText: { fontSize: 14, lineHeight: 20, color: "#3D2B1F" },
  planEmptyText: { fontSize: 13, color: "#8A6A57" },
  secondaryButton: {
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#7A4B2F",
  },
  secondaryButtonText: { color: "#7A4B2F", fontSize: 14, fontWeight: "800" },
});
