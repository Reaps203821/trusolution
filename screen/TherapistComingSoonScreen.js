import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const TherapistComingSoonScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="medical-outline" size={48} color="#3D2B1F" />
        </View>

        <Text style={styles.title}>Therapist App Coming Soon</Text>

        <Text style={styles.description}>
          The therapist experience is currently being developed. We'll let you
          know when it's ready.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.replace("SignIn")}
        >
          <Text style={styles.buttonText}>Back to Sign In</Text>
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
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FFF8EE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#3D2B1F",
    textAlign: "center",
    marginBottom: 12,
  },

  description: {
    fontSize: 15,
    lineHeight: 23,
    color: "#8A6A57",
    textAlign: "center",
    maxWidth: 340,
    marginBottom: 28,
  },

  button: {
    backgroundColor: "#3D2B1F",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 14,
  },

  buttonText: {
    color: "#FFF9F3",
    fontSize: 15,
    fontWeight: "800",
  },
});

export default TherapistComingSoonScreen;
