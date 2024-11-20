import { View, Text, TouchableOpacity, Platform } from "react-native";
import React from "react";
import { Stack, useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

const Layout = () => {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: Colors.itemBackground },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(modal)/create"
        options={{
          headerStyle: { backgroundColor: Colors.itemBackground },
          presentation: Platform.select({
            ios: "modal",
            android: "card",
          }),
          title: "New thread",
          headerRight: () => (
            <TouchableOpacity>
              <Ionicons
                name="ellipsis-horizontal-circle"
                size={24}
                color="white"
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="(modal)/edit-profile"
        options={{
          headerStyle: { backgroundColor: Colors.itemBackground },
          presentation: Platform.select({
            ios: "modal",
            android: "card",
          }),
          title: "",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push("/(auth)/(tabs)/profile")}
            >
              <Text style={{ color: "white" }}>キャンセル</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="(modal)/image/[url]"
        options={{
          presentation: "fullScreenModal",
          title: "",
          headerStyle: { backgroundColor: "black" },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push("/(auth)/(tabs)/feed")}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity>
              <Ionicons
                name="ellipsis-horizontal-circle"
                size={24}
                color="white"
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="(modal)/reply/[id]"
        options={{
          presentation: Platform.select({
            ios: "modal",
            android: "card",
          }),
          title: "",
          headerStyle: {
            backgroundColor: Colors.itemBackground,
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push("/(auth)/(tabs)/feed")}
            >
              <Text>Cancel</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
};

export default Layout;
