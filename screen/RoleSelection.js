import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

const RoleSelection = () => {
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleContinue = async () => {
    if (!selectedRole || !currentUser?.id) {
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: selectedRole })
        .eq("id", currentUser.id);

      if (error) {
        console.log("Error saving user role:", error.message);
        setSaveError("Couldn't save your choice. Please try again.");
        return;
      }

      if (selectedRole === "user") {
        navigation.replace("SelectIssues");
        return;
      }

      if (selectedRole === "therapist") {
        navigation.replace("TherapistComingSoon");
      }
    } catch (error) {
      console.log("Error saving user role:", error);
      setSaveError("Couldn't save your choice. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>How will you use the app?</Text>

          <Text style={styles.subtitle}>
            Choose the option that best describes you.
          </Text>
        </View>

        <View style={styles.options}>
          {/* USER OPTION */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === "user" && styles.selectedCard,
            ]}
            onPress={() => setSelectedRole("user")}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="person-outline" size={30} color="#3D2B1F" />
            </View>

            <View style={styles.roleTextContainer}>
              <Text style={styles.roleTitle}>I'm a User</Text>

              <Text style={styles.roleDescription}>
                Find support, connect with therapists, track your wellbeing, and
                manage your personal journey.
              </Text>
            </View>

            <View style={styles.radio}>
              {selectedRole === "user" && <View style={styles.radioSelected} />}
            </View>
          </TouchableOpacity>

          {/* THERAPIST OPTION */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === "therapist" && styles.selectedCard,
            ]}
            onPress={() => setSelectedRole("therapist")}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="medical-outline" size={30} color="#3D2B1F" />
            </View>

            <View style={styles.roleTextContainer}>
              <Text style={styles.roleTitle}>I'm a Therapist</Text>

              <Text style={styles.roleDescription}>
                Manage clients, appointments, availability, and your
                professional profile.
              </Text>
            </View>

            <View style={styles.radio}>
              {selectedRole === "therapist" && (
                <View style={styles.radioSelected} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

        <TouchableOpacity
          style={[
            styles.button,
            (!selectedRole || isSaving) && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedRole || isSaving}
        >
          <Text style={styles.buttonText}>
            {isSaving ? "Saving..." : "Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5E6CB",
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },

  header: {
    marginBottom: 28,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#3D2B1F",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#8A6A57",
  },

  options: {
    gap: 16,
    marginBottom: 24,
  },

  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8EE",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ECD8C1",
    padding: 18,
  },

  selectedCard: {
    borderWidth: 2,
    borderColor: "#3D2B1F",
  },

  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#F9F1E5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  roleTextContainer: {
    flex: 1,
  },

  roleTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#3D2B1F",
    marginBottom: 5,
  },

  roleDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: "#8A6A57",
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#8A6A57",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3D2B1F",
  },

  button: {
    backgroundColor: "#3D2B1F",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 15,
  },

  buttonDisabled: {
    backgroundColor: "#B8A583",
  },

  errorText: {
    color: "#B3261E",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },

  buttonText: {
    color: "#FFF9F3",
    fontSize: 15,
    fontWeight: "800",
  },
});

export default RoleSelection;
