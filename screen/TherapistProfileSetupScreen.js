import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTherapist } from "../context/TherapistContext";
import { useAlert } from "../context/AlertContext";

const SESSION_TYPE_OPTIONS = ["Chat", "Call", "In-Person"];

export default function TherapistProfileSetupScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { therapistProfile, saveTherapistProfile } = useTherapist();
  const { alert } = useAlert();

  const [fullName, setFullName] = useState(therapistProfile?.fullName || "");
  const [specialty, setSpecialty] = useState(therapistProfile?.specialty || "");
  const [bio, setBio] = useState(therapistProfile?.bio || "");
  const [credentials, setCredentials] = useState(
    therapistProfile?.credentials || "",
  );
  const [yearsExperience, setYearsExperience] = useState(
    therapistProfile?.yearsExperience ? String(therapistProfile.yearsExperience) : "",
  );
  const [sessionTypes, setSessionTypes] = useState(
    therapistProfile?.sessionTypes?.length
      ? therapistProfile.sessionTypes
      : ["Chat", "Call"],
  );
  const [photoUrl, setPhotoUrl] = useState(therapistProfile?.photoUrl || "");
  const [isSaving, setIsSaving] = useState(false);

  const toggleSessionType = (type) => {
    setSessionTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Photo permission needed", "Allow gallery access to choose a photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUrl(result.assets[0].uri);
    }
  };

  const isFormValid = fullName.trim() && specialty.trim() && sessionTypes.length > 0;

  const handleSave = async () => {
    if (!isFormValid) {
      alert(
        "A few things are missing",
        "Please add your name, specialty, and at least one session type.",
      );
      return;
    }

    setIsSaving(true);
    const saved = await saveTherapistProfile({
      fullName: fullName.trim(),
      specialty: specialty.trim(),
      bio: bio.trim(),
      credentials: credentials.trim(),
      yearsExperience: yearsExperience ? parseInt(yearsExperience, 10) : null,
      sessionTypes,
      photoUrl,
      isAcceptingClients: true,
    });
    setIsSaving(false);

    if (!saved) {
      alert("Something went wrong", "We couldn't save your profile. Please try again.");
      return;
    }

    navigation.replace("TherapistAvailability", { fromOnboarding: true });
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
        <Text style={styles.title}>Set up your therapist profile</Text>
        <Text style={styles.subtitle}>
          This is what clients will see when browsing for support.
        </Text>

        <TouchableOpacity style={styles.photoPicker} onPress={pickPhoto}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={26} color="#7A4B2F" />
            </View>
          )}
          <Text style={styles.photoLabel}>Add a photo</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Full name</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Dr. Jane Smith"
          placeholderTextColor="#B8A38C"
        />

        <Text style={styles.label}>Specialty</Text>
        <TextInput
          style={styles.input}
          value={specialty}
          onChangeText={setSpecialty}
          placeholder="Anxiety & Stress"
          placeholderTextColor="#B8A38C"
        />

        <Text style={styles.label}>Credentials</Text>
        <TextInput
          style={styles.input}
          value={credentials}
          onChangeText={setCredentials}
          placeholder="LMFT, PhD, etc."
          placeholderTextColor="#B8A38C"
        />

        <Text style={styles.label}>Years of experience</Text>
        <TextInput
          style={styles.input}
          value={yearsExperience}
          onChangeText={(v) => setYearsExperience(v.replace(/[^0-9]/g, ""))}
          placeholder="5"
          placeholderTextColor="#B8A38C"
          keyboardType="number-pad"
        />

        <Text style={styles.label}>About you</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={setBio}
          placeholder="Share your approach and what clients can expect..."
          placeholderTextColor="#B8A38C"
          multiline
        />

        <Text style={styles.label}>Session types you offer</Text>
        <View style={styles.chipRow}>
          {SESSION_TYPE_OPTIONS.map((type) => {
            const selected = sessionTypes.includes(type);
            return (
              <TouchableOpacity
                key={type}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => toggleSessionType(type)}
              >
                <Text
                  style={[styles.chipText, selected && styles.chipTextSelected]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (!isFormValid || isSaving) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isFormValid || isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? "Saving..." : "Save & Continue"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5E6CB" },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: "800", color: "#3D2B1F", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#8A6A57", marginBottom: 20, lineHeight: 20 },
  photoPicker: { alignItems: "center", marginBottom: 24 },
  photo: { width: 88, height: 88, borderRadius: 44, marginBottom: 8 },
  photoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FFF8EE",
    borderWidth: 1,
    borderColor: "#ECD8C1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  photoLabel: { fontSize: 13, color: "#7A4B2F", fontWeight: "700" },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3D2B1F",
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: "#FFF8EE",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ECD8C1",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#3D2B1F",
  },
  textArea: { height: 100, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#FFF8EE",
    borderWidth: 1,
    borderColor: "#ECD8C1",
  },
  chipSelected: { backgroundColor: "#7A4B2F", borderColor: "#7A4B2F" },
  chipText: { fontSize: 13, fontWeight: "700", color: "#7A4B2F" },
  chipTextSelected: { color: "#FFF9F3" },
  saveButton: {
    backgroundColor: "#3D2B1F",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 28,
  },
  saveButtonDisabled: { backgroundColor: "#B8A583" },
  saveButtonText: { color: "#FFF9F3", fontSize: 15, fontWeight: "800" },
});
