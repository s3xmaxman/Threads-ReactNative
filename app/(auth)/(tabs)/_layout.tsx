import React from "react";
import { Tabs } from "expo-router";
import { StyleSheet, TouchableOpacity, Text, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";

import * as Haptics from "expo-haptics";
import { CREATE_MODAL_PATH } from "@/constants/Path";

const CreateTabIcon = ({ color, size }: { color: string; size: number }) => (
  <View style={styles.createIconContainer}>
    <Ionicons name="add" size={size} color={color} />
  </View>
);

const Layout = () => {
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: "white",
        tabBarStyle: {
          backgroundColor: Colors.itemBackground,
          borderTopWidth: 0,
          height: 80,
        },
        tabBarItemStyle: {
          margin: 20,
          padding: 0,
        },
        tabBarIconStyle: {
          width: 30,
          height: 30,
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={32}
              color={color}
            />
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => signOut()}>
              <Text style={styles.logoutText}>Log out</Text>
            </TouchableOpacity>
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "search" : "search-outline"}
              size={32}
              color={color}
            />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color, size }) => (
            <CreateTabIcon color={color} size={size} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            Haptics.selectionAsync();
            router.push(CREATE_MODAL_PATH);
          },
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "heart" : "heart-outline"}
              size={32}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={32}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default Layout;

const styles = StyleSheet.create({
  logoutText: {
    marginRight: 10,
    color: "blue",
  },
  createIconContainer: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 6,
    width: 36,
    height: 36,
  },
});
