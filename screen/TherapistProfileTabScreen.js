import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTherapist } from "../context/TherapistContext";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";

export default function TherapistProfileTabScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { therapistProfile } = useTherapist();
  const { signOut } = useAuth();
  const { alert } = useAlert();

  const handleLogout = () => {
    alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          navigation.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: "SignIn" }] }),
          );
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          {therapistProfile?.photoUrl ? (
            <Image source={{ uri: therapistProfile.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {(therapistProfile?.fullName || "T").charAt(0)}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{therapistProfile?.fullName || "Therapist"}</Text>
          <Text style={styles.specialty}>{therapistProfile?.specialty || "Add your specialty"}</Text>
          {therapistProfile?.credentials ? (
            <View style={styles.credentialPill}>
              <Text style={styles.credentialText}>{therapistProfile.credentials}</Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => navigation.navigate("TherapistProfileSetup")}
        >
          <Ionicons name="person-circle-outline" size={20} color="#7A4B2F" />
          <Text style={styles.actionText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={16} color="#B29A7F" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => navigation.navigate("TherapistAvailability")}
        >
          <Ionicons name="calendar-outline" size={20} color="#7A4B2F" />
          <Text style={styles.actionText}>Manage Availability</Text>
          <Ionicons name="chevron-forward" size={16} color="#B29A7F" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#A84B3C" />
          <Text style={[styles.actionText, { color: "#A84B3C" }]}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5E6CB" },
  content: { padding: 18, paddingBottom: 40 },
  profileCard: {
    alignItems: "center",
    backgroundColor: "#FFF8EE",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ECD8C1",
    padding: 22,
    marginBottom: 20,
  },
  avatar: { width: 84, height: 84, borderRadius: 42, marginBottom: 12 },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#7A4B2F",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarInitial: { color: "#FFF8EE", fontSize: 28, fontWeight: "800" },
  name: { fontSize: 19, fontWeight: "800", color: "#3D2B1F" },
  specialty: { fontSize: 13, color: "#8A6A57", marginTop: 4 },
  credentialPill: {
    marginTop: 10,
    backgroundColor: "#F5E6CB",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  credentialText: { fontSize: 12, fontWeight: "700", color: "#7A4B2F" },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFF8EE",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECD8C1",
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 10,
  },
  actionText: { flex: 1, fontSize: 14, fontWeight: "700", color: "#3D2B1F" },
});
