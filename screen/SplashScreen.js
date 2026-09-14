import React, { useEffect } from "react";
import { View, Image, Text, StyleSheet, StatusBar } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const MIN_SPLASH_MS = 2000;

const SplashScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { currentUser, isHydrated } = useAuth();

  useEffect(() => {
    if (!isHydrated) {
      return undefined;
    }

    let isActive = true;

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const resolveDestination = async () => {
      if (!currentUser) {
        return "Onboarding1";
      }

      try {
        const { data: profileRow, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (error) {
          console.log("Error reading user role:", error.message);
          return "RoleSelection";
        }

        if (profileRow?.role === "user") {
          return "MainTabs";
        }

        if (profileRow?.role === "therapist") {
          const { data: therapistRow } = await supabase
            .from("therapist_profiles")
            .select("id, full_name")
            .eq("id", currentUser.id)
            .maybeSingle();

          return therapistRow?.full_name
            ? "TherapistTabs"
            : "TherapistProfileSetup";
        }

        // No role chosen yet
        return "RoleSelection";
      } catch (err) {
        console.log("Error reading user role:", err);
        return "RoleSelection";
      }
    };

    (async () => {
      const [destination] = await Promise.all([
        resolveDestination(),
        wait(MIN_SPLASH_MS),
      ]);

      if (isActive) {
        navigation.replace(destination);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [currentUser, isHydrated, navigation]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#5D3020" />
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.logoTextContainer}>
          <Image
            source={require("../assets/logo.png")}
            style={styles.image}
            resizeMode="contain"
          />
          <Text style={styles.text}>TRUSOLUTION</Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5D3020",
    justifyContent: "center",
    alignItems: "center",
  },
  logoTextContainer: {
    alignItems: "center",
    transform: [{ translateY: 18 }],
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  text: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFF",
    letterSpacing: 3,
  },
});

export default SplashScreen;
