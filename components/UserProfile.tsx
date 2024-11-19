import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Colors } from "@/constants/Colors";
import { Link } from "expo-router";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Id } from "@/convex/_generated/dataModel";

type UserProfileProps = {
  userId?: string;
};

export const UserProfile = ({ userId }: UserProfileProps) => {
  const profile = useQuery(api.users.getUserById, {
    userId: userId as Id<"users">,
  });
  const { userProfile } = useUserProfile();
  const isSelf = userProfile?._id === userId;

  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        <View style={styles.profileTextContainer}>
          <Text style={styles.name}>
            {profile?.first_name} {profile?.last_name}
          </Text>
          <Text style={styles.email}>{profile?.email}</Text>
        </View>
        <Image source={{ uri: profile?.imageUrl }} style={styles.image} />
      </View>

      <Text style={styles.bio}>{profile?.bio || "No bio"}</Text>
      <View style={styles.buttonRow}>
        {isSelf ? (
          <>
            <Link
              // @ts-expect-error
              href={`/(modal)/edit-profile?biostring=${
                profile?.bio ? encodeURIComponent(profile?.bio) : ""
              }&linkstring=${profile?.websiteUrl ? encodeURIComponent(profile?.websiteUrl) : ""}&userId=${
                profile?._id
              }&imageUrl=${profile?.imageUrl ? encodeURIComponent(profile?.imageUrl) : ""}`}
              asChild
            >
              <TouchableOpacity style={styles.button}>
                <Text style={styles.fullButtonText}>プロフィールを編集</Text>
              </TouchableOpacity>
            </Link>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>フォロー</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>メンション</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileTextContainer: {
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  email: {
    fontSize: 14,
    color: "#808080",
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  bio: {
    fontSize: 14,
    marginTop: 16,
    marginBottom: 16,
    color: "white",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 16,
    gap: 16,
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.itemBackground,
  },
  buttonText: {
    fontWeight: "bold",
    color: "white",
  },
  fullButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: Colors.itemBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  fullButtonText: {
    fontWeight: "bold",
    color: "white",
  },
});
