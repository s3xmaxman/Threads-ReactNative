import { Platform, PlatformColor } from "react-native";

export const Colors = {
  background: "#000000",
  border: "#2A2A2A",
  itemBackground: "#1A1A1A",

  ...Platform.select({
    ios: {
      submit: PlatformColor("systemBlueColor"),
    },
    android: {
      submit: PlatformColor("@android:color/system_primary_dark"),
    },
    default: { submit: "#ffffff" },
  }),
};
