import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: Colors.itemBackground },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Thread",
          headerShown: true,
          headerShadowVisible: false,
          headerRight: () => (
            <Ionicons name="notifications-outline" size={24} color="white" />
          ),
          headerTintColor: "white",
          headerBackTitle: "Back",
          headerStyle: {
            backgroundColor: Colors.itemBackground,
          },
        }}
      />
    </Stack>
  );
};
export default Layout;
