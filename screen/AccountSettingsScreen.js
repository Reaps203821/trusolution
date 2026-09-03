import React, { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWellness } from "../context/WellnessContext";
import { useAlert } from "../context/AlertContext";

export default function AccountSettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { profile, updateProfile } = useWellness();
  const { alert } = useAlert();
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [username, setUsername] = useState(profile.username);
  const [profileImageUri, setProfileImageUri] = useState(profile.profileImageUri);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  useEffect(() => {
    setFullName(profile.fullName);
    setEmail(profile.email);
    setUsername(profile.username);
    setProfileImageUri(profile.profileImageUri);
  }, [profile.email, profile.fullName, profile.profileImageUri, profile.username]);

  useEffect(() => {
    if (!showSaveSuccess) {
      return undefined;
    }

    const timer = setTimeout(() => navigation.goBack(), 1200);
    return () => clearTimeout(timer);
  }, [navigation, showSaveSuccess]);

  const pickProfilePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Photo permission needed", "Allow gallery access to choose a profile photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfileImageUri(result.assets[0].uri);
    }
  };

  const saveChanges = () => {
    updateProfile({
      fullName: fullName.trim(),
      username: username.trim(),
      email: email.trim(),
      profileImageUri,
    });
    setShowSaveSuccess(true);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#3D2B1F" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.profileCard}>
          <TouchableOpacity
            style={styles.avatar}
            onPress={pickProfilePhoto}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
          >
            {profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={30} color="#FFF8EC" />
            )}
            <View style={styles.editPhotoBadge}>
              <Ionicons name="camera" size={13} color="#FFF9F3" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickProfilePhoto}>
            <Text style={styles.changePhotoText}>Change profile photo</Text>
          </TouchableOpacity>
          <Text style={styles.profileName}>{fullName}</Text>
          <Text style={styles.profileMeta}>Your private profile on this device</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full name"
            placeholderTextColor="#8B7355"
          />
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Username"
            placeholderTextColor="#8B7355"
          />
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email address"
            placeholderTextColor="#8B7355"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Access</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Sign-in Method</Text>
            <Text style={styles.infoValue}>Email and password</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Recovery Email</Text>
            <Text style={styles.infoValue}>{email}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveChanges}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showSaveSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={28} color="#256D3C" />
            </View>
            <Text style={styles.successTitle}>Changes saved</Text>
            <Text style={styles.successText}>
              Your profile was updated on this device. Returning to Settings…
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.successButtonText}>Back to Settings now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5E6CB",
  },
  content: {
    padding: 18,
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F7EBDD",
    alignItems: "center",
    justifyContent: "center",
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
  profileCard: {
    backgroundColor: "#FFF8EE",
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    marginBottom: 18,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#7A4B2F",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  editPhotoBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#256D3C",
    borderWidth: 2,
    borderColor: "#FFF8EE",
  },
  changePhotoText: {
    color: "#7A4B2F",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(45, 34, 24, 0.5)",
  },
  successModal: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    backgroundColor: "#FFF8EE",
    borderRadius: 24,
    padding: 24,
  },
  successIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7F4E1",
    marginBottom: 14,
  },
  successTitle: { color: "#3D2B1F", fontSize: 22, fontWeight: "800", marginBottom: 8 },
  successText: { color: "#7B6753", fontSize: 14, lineHeight: 20, textAlign: "center", marginBottom: 18 },
  successButton: { width: "100%", alignItems: "center", backgroundColor: "#7A4B2F", borderRadius: 14, paddingVertical: 13 },
  successButtonText: { color: "#FFF9F3", fontSize: 14, fontWeight: "800" },
  profileName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#4A2818",
  },
  profileMeta: {
    fontSize: 13,
    color: "#7B6753",
    marginTop: 6,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#3D2B1F",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#FFF8EE",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ECD8C1",
    color: "#4A2818",
  },
  infoCard: {
    backgroundColor: "#F7EBDD",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 13,
    color: "#7B6753",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4A2818",
  },
  saveButton: {
    backgroundColor: "#3D2B1F",
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFF8EC",
    fontSize: 16,
    fontWeight: "800",
  },
});
