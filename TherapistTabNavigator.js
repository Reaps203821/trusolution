import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import TherapistHomeScreen from "./screen/TherapistHomeScreen";
import TherapistSessionsScreen from "./screen/TherapistSessionsScreen";
import TherapistMessagesScreen from "./screen/TherapistMessagesScreen";
import TherapistClientsScreen from "./screen/TherapistClientsScreen";
import TherapistProfileTabScreen from "./screen/TherapistProfileTabScreen";
import { hapticLight } from "./lib/haptics";

const Tab = createBottomTabNavigator();

export default function TherapistTabNavigator() {
  const insets = useSafeAreaInsets();
  const tabHeight = 68 + insets.bottom;

  return (
    <Tab.Navigator
      screenListeners={{
        tabPress: () => hapticLight(),
      }}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "TherapistHome") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "TherapistSessions") {
            iconName = focused ? "calendar" : "calendar-outline";
          } else if (route.name === "TherapistMessages") {
            iconName = focused ? "chatbubble" : "chatbubble-outline";
          } else if (route.name === "TherapistClients") {
            iconName = focused ? "people" : "people-outline";
          } else if (route.name === "TherapistProfileTab") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#7A4B2F",
        tabBarInactiveTintColor: "#8A6A57",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginBottom: 4,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFF8EE",
          height: tabHeight,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          borderTopWidth: 1,
          borderTopColor: "#ECD8C1",
          borderRadius: 0,
          shadowOpacity: 0,
          elevation: 0,
        },
      })}
    >
      <Tab.Screen
        name="TherapistHome"
        component={TherapistHomeScreen}
        options={{ tabBarLabel: "Home" }}
      />
      <Tab.Screen
        name="TherapistSessions"
        component={TherapistSessionsScreen}
        options={{ tabBarLabel: "Sessions" }}
      />
      <Tab.Screen
        name="TherapistMessages"
        component={TherapistMessagesScreen}
        options={{ tabBarLabel: "Messages" }}
      />
      <Tab.Screen
        name="TherapistClients"
        component={TherapistClientsScreen}
        options={{ tabBarLabel: "Clients" }}
      />
      <Tab.Screen
        name="TherapistProfileTab"
        component={TherapistProfileTabScreen}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
}
