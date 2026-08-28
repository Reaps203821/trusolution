import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWellness } from "../context/WellnessContext";

export default function SupportPlanScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { supportPlan, updateSupportPlan } = useWellness();
  const [warningSigns, setWarningSigns] = useState(supportPlan.warningSigns);
  const [copingSteps, setCopingSteps] = useState(supportPlan.copingSteps);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    setWarningSigns(supportPlan.warningSigns);
    setCopingSteps(supportPlan.copingSteps);
  }, [supportPlan.copingSteps, supportPlan.warningSigns]);

  const savePlan = () => {
    updateSupportPlan({ warningSigns: warningSigns.trim(), copingSteps: copingSteps.trim() });
    Alert.alert("Support plan saved", "Your plan is saved on this device.");
  };

  const addTrustedContact = () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert("Add contact details", "Enter a name and phone number first.");
      return;
    }
    updateSupportPlan({
      trustedContacts: [
        ...supportPlan.trustedContacts,
        { id: `${Date.now()}`, name: contactName.trim(), phone: contactPhone.trim() },
      ],
    });
    setContactName("");
    setContactPhone("");
  };

  const callContact = async (phone) => {
    const url = `tel:${phone.replace(/[^+\d]/g, "")}`;
    if (await Linking.canOpenURL(url)) {
      Linking.openURL(url);
    } else {
      Alert.alert("Unable to call", "Your device could not open the phone app.");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#3D2B1F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Support Plan</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.safetyCard}>
          <Ionicons name="shield-checkmark" size={24} color="#FFF9F3" />
          <View style={styles.safetyTextWrap}>
            <Text style={styles.safetyTitle}>For difficult moments</Text>
            <Text style={styles.safetyText}>
              If you are in immediate danger or might harm yourself, call local emergency services or go to the nearest emergency department now.
            </Text>
          </View>
        </View>

        <Text style={styles.intro}>
          Keep a few personal reminders ready. This is a private planning tool, not emergency or medical care.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>My warning signs</Text>
          <Text style={styles.hint}>What thoughts, feelings, or situations tell you that you need extra support?</Text>
          <TextInput
            style={styles.textArea}
            value={warningSigns}
            onChangeText={setWarningSigns}
            placeholder="For example: I stop replying to people, sleep poorly, or feel trapped."
            placeholderTextColor="#8A6A57"
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Things that help me cope</Text>
          <Text style={styles.hint}>Write simple steps you can try, such as taking a walk, breathing slowly, or journaling.</Text>
          <TextInput
            style={styles.textArea}
            value={copingSteps}
            onChangeText={setCopingSteps}
            placeholder="Write one small step per line."
            placeholderTextColor="#8A6A57"
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={savePlan}>
          <Text style={styles.saveButtonText}>Save My Plan</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>People I can contact</Text>
          <Text style={styles.hint}>Add someone you trust. Their number stays on this device.</Text>
          <TextInput
            style={styles.input}
            value={contactName}
            onChangeText={setContactName}
            placeholder="Name"
            placeholderTextColor="#8A6A57"
          />
          <TextInput
            style={styles.input}
            value={contactPhone}
            onChangeText={setContactPhone}
            placeholder="Phone number"
            placeholderTextColor="#8A6A57"
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.addButton} onPress={addTrustedContact}>
            <Ionicons name="person-add-outline" size={18} color="#FFF9F3" />
            <Text style={styles.addButtonText}>Add trusted contact</Text>
          </TouchableOpacity>

          {supportPlan.trustedContacts.map((contact) => (
            <View key={contact.id} style={styles.contactRow}>
              <View>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
              <TouchableOpacity style={styles.callButton} onPress={() => callContact(contact.phone)}>
                <Ionicons name="call" size={18} color="#FFF9F3" />
                <Text style={styles.callText}>Call</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5E6CB" },
  content: { padding: 18, paddingBottom: 30 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F7EBDD", alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 21, fontWeight: "800", color: "#3D2B1F" },
  headerSpacer: { width: 40 },
  safetyCard: { flexDirection: "row", gap: 12, padding: 16, borderRadius: 20, backgroundColor: "#A84B3C", marginBottom: 14 },
  safetyTextWrap: { flex: 1 },
  safetyTitle: { color: "#FFF9F3", fontSize: 16, fontWeight: "800", marginBottom: 4 },
  safetyText: { color: "#FFF3EB", fontSize: 13, lineHeight: 19 },
  intro: { color: "#6F5B48", fontSize: 14, lineHeight: 21, marginBottom: 14 },
  card: { backgroundColor: "#FFF8EE", borderRadius: 20, padding: 16, marginBottom: 14 },
  sectionTitle: { color: "#3D2B1F", fontSize: 17, fontWeight: "800", marginBottom: 6 },
  hint: { color: "#7B6753", fontSize: 13, lineHeight: 18, marginBottom: 12 },
  textArea: { minHeight: 105, padding: 12, borderWidth: 1, borderColor: "#ECD8C1", borderRadius: 14, color: "#3D2B1F", fontSize: 14 },
  input: { padding: 12, borderWidth: 1, borderColor: "#ECD8C1", borderRadius: 14, color: "#3D2B1F", fontSize: 14, marginBottom: 10 },
  saveButton: { alignItems: "center", backgroundColor: "#3D2B1F", borderRadius: 16, paddingVertical: 15, marginBottom: 14 },
  saveButtonText: { color: "#FFF9F3", fontSize: 15, fontWeight: "800" },
  addButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#7A4B2F", borderRadius: 14, paddingVertical: 13, marginBottom: 12 },
  addButtonText: { color: "#FFF9F3", fontSize: 14, fontWeight: "800" },
  contactRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#ECD8C1", paddingTop: 12, marginTop: 4 },
  contactName: { color: "#3D2B1F", fontSize: 15, fontWeight: "800" },
  contactPhone: { color: "#7B6753", fontSize: 13, marginTop: 3 },
  callButton: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#256D3C", borderRadius: 14, paddingHorizontal: 13, paddingVertical: 10 },
  callText: { color: "#FFF9F3", fontSize: 13, fontWeight: "800" },
});
