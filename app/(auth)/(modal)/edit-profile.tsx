import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const Page = () => {
  const { biostring, linkstring, userId, imageUrl } = useLocalSearchParams<{
    biostring: string;
    linkstring: string;
    userId: string;
    imageUrl: string;
  }>();

  const [bio, setBio] = useState(biostring);
  const [link, setLink] = useState(linkstring);

  const router = useRouter();
  const updateUser = useMutation(api.users.updateUser);

  const onDone = async () => {
    await updateUser({
      _id: userId as Id<"users">,
      bio,
      websiteUrl: link,
    });

    router.dismiss();
  };

  return (
    <View>
      <Stack.Screen />
      <Image source={{ uri: imageUrl }} style={styles.image} />
      <View style={styles.section}>
        <Text style={styles.label}>Bio</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="自己紹介を書く"
          placeholderTextColor="white"
          numberOfLines={4}
          multiline
          textAlignVertical="top"
          style={styles.bioInput}
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Website</Text>
        <TextInput
          value={link}
          onChangeText={setLink}
          placeholder="https://example.com"
          placeholderTextColor="white"
          autoCapitalize="none"
          style={{ color: "white" }}
        />
      </View>
      <TouchableOpacity style={styles.bottomButton} onPress={onDone}>
        <Text style={styles.bottomButtonText}>完了</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Page;

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    padding: 8,
    margin: 16,
  },
  bioInput: {
    height: 100,
    color: "white",
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
    color: "white",
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
  bottomButton: {
    backgroundColor: "white",
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  bottomButtonText: {
    color: "black",
    fontSize: 16,
    fontWeight: "bold",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
  },
});
