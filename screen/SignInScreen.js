import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { useAlert } from "../context/AlertContext";

const validateEmail = (email) => /\S+@\S+\.\S+/.test(email.trim());

const SignInScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { signIn, forgotPassword } = useAuth();
  const { alert } = useAlert();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");

const handleSignIn = async () => {
  const nextErrors = {};

  if (!email.trim()) {
    nextErrors.email = "Please enter your email.";
  } else if (!validateEmail(email)) {
    nextErrors.email = "Please enter a valid email address.";
  }
  if (!password) {
    nextErrors.password = "Please enter your password.";
  }

  setErrors(nextErrors);
  if (Object.keys(nextErrors).length > 0) {
    return;
  }

  setIsSubmitting(true);
  const result = await signIn({ email, password });

  if (!result.ok) {
    setIsSubmitting(false);
    setErrors({ form: result.error });
    return;
  }

  try {
    const { data: profileRow, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", result.user.id)
      .maybeSingle();

    if (error) {
      console.log("Error reading user role:", error.message);
      navigation.replace("RoleSelection");
      return;
    }

    if (profileRow?.role === "user") {
      navigation.replace("MainTabs");
      return;
    }

    if (profileRow?.role === "therapist") {
      navigation.replace("TherapistComingSoon");
      return;
    }

    // If no role has been chosen yet
    navigation.replace("RoleSelection");
  } catch (error) {
    console.log("Error reading user role:", error);
    navigation.replace("RoleSelection");
  } finally {
    setIsSubmitting(false);
  }
};

  const handleForgotSubmit = () => {
    if (!forgotEmail.trim() || !validateEmail(forgotEmail)) {
      setForgotError("Please enter a valid email address.");
      return;
    }

    const result = forgotPassword({ email: forgotEmail });

    if (!result.ok) {
      setForgotError(result.error);
      return;
    }

    setShowForgot(false);
    setForgotEmail("");
    setForgotError("");
    alert("Reset email sent", result.message);
  };

  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: insets.bottom + 20 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.hero}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in to continue your support journey.
              </Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.field}>
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color="#8A6A57" />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#8F7B6D"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {errors.email ? (
                  <Text style={styles.errorText}>{errors.email}</Text>
                ) : null}
              </View>

              <View style={styles.field}>
                <View style={styles.inputWrap}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color="#8A6A57"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#8F7B6D"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={10}
                  >
                    <Ionicons
                      name={showPassword ? "eye" : "eye-off"}
                      size={18}
                      color="#8A6A57"
                    />
                  </TouchableOpacity>
                </View>
                {errors.password ? (
                  <Text style={styles.errorText}>{errors.password}</Text>
                ) : null}
              </View>

              {errors.form ? (
                <Text style={styles.formError}>{errors.form}</Text>
              ) : null}

              <TouchableOpacity
                style={[styles.button, isSubmitting && styles.buttonDisabled]}
                onPress={handleSignIn}
                disabled={isSubmitting}
              >
                <Text style={styles.buttonText}>
                  {isSubmitting ? "Signing In..." : "Sign In"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inlineButton}
                onPress={() => {
                  setForgotEmail(email);
                  setForgotError("");
                  setShowForgot(true);
                }}
              >
                <Text style={styles.inlineText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate("SignUp")}
            >
              <Text style={styles.linkText}>
                Don't have an account? Sign Up
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showForgot}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgot(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity
                onPress={() => setShowForgot(false)}
                hitSlop={10}
              >
                <Ionicons name="close" size={22} color="#8A6A57" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalText}>
              Enter the email associated with your account and we'll help you
              reset your password.
            </Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#8A6A57" />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#8F7B6D"
                value={forgotEmail}
                onChangeText={setForgotEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {forgotError ? (
              <Text style={styles.errorText}>{forgotError}</Text>
            ) : null}
            <TouchableOpacity
              style={styles.button}
              onPress={handleForgotSubmit}
            >
              <Text style={styles.buttonText}>Send Reset Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5E6CB",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  hero: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#3D2B1F",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#8A6A57",
  },
  formCard: {
    backgroundColor: "#FFF8EE",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#ECD8C1",
    padding: 16,
    marginBottom: 14,
  },
  field: {
    marginBottom: 12,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F1E5",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ECD8C1",
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#3D2B1F",
    paddingVertical: 13,
    paddingLeft: 8,
  },
  errorText: {
    color: "#B24A3A",
    fontSize: 12,
    marginTop: 5,
    marginLeft: 4,
  },
  formError: {
    color: "#B24A3A",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#3D2B1F",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: "#B8A583",
  },
  buttonText: {
    color: "#FFF9F3",
    fontSize: 15,
    fontWeight: "800",
  },
  inlineButton: {
    alignSelf: "center",
    marginTop: 12,
    paddingVertical: 6,
  },
  inlineText: {
    color: "#7A4B2F",
    fontSize: 13,
    fontWeight: "700",
  },
  linkButton: {
    alignSelf: "center",
    paddingVertical: 8,
  },
  linkText: {
    color: "#3D2B1F",
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(45, 34, 24, 0.55)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFF8EE",
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#3D2B1F",
  },
  modalText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6E5444",
    marginBottom: 14,
  },
});

export default SignInScreen;
