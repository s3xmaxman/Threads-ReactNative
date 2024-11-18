import {
  Slot,
  useNavigationContainerRef,
  useSegments,
  ErrorBoundary,
  Stack,
} from "expo-router";
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
  ClerkProvider,
  ClerkLoaded,
  useAuth,
  useUser,
} from "@clerk/clerk-expo";
import { tokenCache } from "@/utils/cache";
import { LogBox, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Missing publishable key");
}

LogBox.ignoreLogs(["Clerk: Clerk has been loaded with development keys"]);

const InitialLayout = () => {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  return <Slot />;
};

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <ClerkLoaded>
        <InitialLayout />
      </ClerkLoaded>
    </ClerkProvider>
  );
}
