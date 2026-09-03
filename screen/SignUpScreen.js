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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";

const validateEmail = (email) => /\S+@\S+\.\S+/.test(email.trim());

const SignUpScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const { alert } = useAlert();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async () => {
    const nextErrors = {};

    if (!fullName.trim()) {
      nextErrors.fullName = "Please enter your full name.";
    }
    if (!email.trim()) {
      nextErrors.email = "Please enter your email.";
    } else if (!validateEmail(email)) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (!password) {
      nextErrors.password = "Please enter a password.";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    const result = await signUp({ fullName, email, password });

    if (!result.ok) {
      setIsSubmitting(false);
      alert("Sign up failed", result.error);
      return;
    }

   navigation.replace("RoleSelection");;
  };

  const renderInput = ({
    value,
    onChangeText,
    placeholder,
    icon,
    secure,
    showToggle,
    onToggle,
    error,
    keyboardType,
    autoCapitalize,
  }) => (
    <View style={styles.field}>
      <View style={styles.inputWrap}>
        <Ionicons name={icon} size={18} color="#8A6A57" />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#8F7B6D"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure && !showToggle}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
        {showToggle ? (
          <TouchableOpacity onPress={onToggle} hitSlop={10}>
            <Ionicons
              name={showToggle ? "eye" : "eye-off"}
              size={18}
              color="#8A6A57"
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  return (
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Set up your account and personalize your support.
            </Text>
          </View>

          <View style={styles.formCard}>
            {renderInput({
              value: fullName,
              onChangeText: setFullName,
              placeholder: "Full name",
              icon: "person-outline",
              error: errors.fullName,
              autoCapitalize: "words",
            })}
            {renderInput({
              value: email,
              onChangeText: setEmail,
              placeholder: "Email",
              icon: "mail-outline",
              error: errors.email,
              keyboardType: "email-address",
              autoCapitalize: "none",
            })}
            {renderInput({
              value: password,
              onChangeText: setPassword,
              placeholder: "Password",
              icon: "lock-closed-outline",
              secure: true,
              showToggle: showPassword,
              onToggle: () => setShowPassword(!showPassword),
              error: errors.password,
            })}
            {renderInput({
              value: confirmPassword,
              onChangeText: setConfirmPassword,
              placeholder: "Confirm Password",
              icon: "checkmark-circle-outline",
              secure: true,
              showToggle: showConfirm,
              onToggle: () => setShowConfirm(!showConfirm),
              error: errors.confirmPassword,
            })}

            <TouchableOpacity
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? "Creating Account..." : "Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate("SignIn")}
          >
            <Text style={styles.linkText}>
              Already have an account? Sign In
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  linkButton: {
    alignSelf: "center",
    paddingVertical: 8,
  },
  linkText: {
    color: "#3D2B1F",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default SignUpScreen;
