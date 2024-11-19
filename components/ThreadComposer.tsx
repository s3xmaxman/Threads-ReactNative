import React, { useState } from "react";
import {
  View,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
  Alert,
  InputAccessoryView,
  ScrollView,
} from "react-native";
import { FontAwesome6, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Stack, useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import * as ImagePicker from "expo-image-picker";
import { Id } from "@/convex/_generated/dataModel";

type ThreadComposerProps = {
  threadId?: Id<"messages">;
  isPreview?: boolean;
  isReply?: boolean;
};

const ThreadComposer = ({
  threadId,
  isPreview,
  isReply,
}: ThreadComposerProps) => {
  const router = useRouter();
  const { userProfile } = useUserProfile();
  const [threadContent, setThreadContent] = useState<string>("");
  const addThread = useMutation(api.messages.addThread);
  const inputAccessoryViewID = "uniqueID";
  const [mediaFiles, setMediaFiles] = useState<ImagePicker.ImagePickerAsset[]>(
    []
  );
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);

  const handleSubmit = async () => {
    const mediaStorageIds = await Promise.all(
      mediaFiles.map(async (file) => uploadMediaFile(file))
    );

    addThread({
      threadId,
      content: threadContent,
      mediaFiles: mediaStorageIds,
    });

    setThreadContent("");
    setMediaFiles([]);
    router.dismiss();
  };

  const removeThread = () => {
    setThreadContent("");
    setMediaFiles([]);
  };

  const handleCancel = () => {
    setThreadContent("");
    Alert.alert("スレッドを破棄しますか？", "", [
      {
        text: "破棄",
        onPress: () => router.dismiss(),
        style: "destructive",
      },
      {
        text: "下書きを保存",
        style: "cancel",
      },
      {
        text: "キャンセル",
        style: "cancel",
      },
    ]);
  };

  const selectImage = async (source: "library" | "camera") => {
    const options: ImagePicker.ImagePickerOptions = {
      allowsEditing: true,
      aspect: [4, 3],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    };

    let result;

    if (source === "camera") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled) {
      setMediaFiles([result.assets[0], ...mediaFiles]);
    }
  };

  const removeImage = (index: number) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
  };

  const uploadMediaFile = async (image: ImagePicker.ImagePickerAsset) => {
    const postUrl = await generateUploadUrl();

    const response = await fetch(image.uri);
    const blob = await response.blob();

    const result = await fetch(postUrl, {
      method: "POST",
      headers: {
        "Content-Type": image.mimeType!,
      },
      body: blob,
    });

    const { storageId } = await result.json();

    return storageId;
  };

  return (
    <TouchableOpacity
      onPress={() => {
        router.push("/(auth)/(modal)/create");
      }}
      style={
        isPreview && {
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: 100,
          pointerEvents: "box-only",
        }
      }
    >
      <Stack.Screen
        options={{
          headerLeft: () => (
            <TouchableOpacity onPress={handleCancel}>
              <Text style={{ color: "#fff" }}>キャンセル</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.topRow}>
        <Image
          source={{ uri: userProfile?.imageUrl as string }}
          style={styles.avatar}
        />
        <View style={styles.centerContainer}>
          <Text style={[styles.name, { color: "#fff" }]}>
            {userProfile?.first_name} {userProfile?.last_name}
          </Text>
          <TextInput
            style={[styles.input, { color: "#fff" }]}
            placeholder={isReply ? "スレッドに返信" : "今どうしてる？"}
            placeholderTextColor={"#fff"}
            value={threadContent}
            onChangeText={setThreadContent}
            multiline
            autoFocus={!isPreview}
            inputAccessoryViewID={inputAccessoryViewID}
          />
          {mediaFiles.length > 0 && (
            <ScrollView horizontal>
              {mediaFiles.map((file, index) => (
                <View key={index} style={styles.mediaContainer}>
                  <Image source={{ uri: file.uri }} style={styles.mediaImage} />
                  <TouchableOpacity
                    style={styles.deleteIconContainer}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          <View style={styles.iconRow}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => selectImage("library")}
            >
              <Ionicons name="images-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => selectImage("camera")}
            >
              <Ionicons name="camera-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialIcons name="gif" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="mic-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <FontAwesome6 name="hashtag" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="stats-chart-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={removeThread}
          style={[styles.cancelButton, { opacity: isPreview ? 0 : 1 }]}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <InputAccessoryView nativeID={inputAccessoryViewID}>
        <View style={[styles.keyboardAccessory]}>
          <Text style={[styles.keyboardAccessoryText, { color: "#fff" }]}>
            {isReply
              ? "誰でも返信・引用できます"
              : "フォローしているプロフィールのみ返信・引用できます"}
          </Text>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={[styles.submitButtonText, { color: "#fff" }]}>
              Post
            </Text>
          </TouchableOpacity>
        </View>
      </InputAccessoryView>
    </TouchableOpacity>
  );
};

export default ThreadComposer;

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  centerContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    fontSize: 16,
    maxHeight: 100,
  },
  cancelButton: {
    marginLeft: 12,
    alignSelf: "flex-start",
  },
  iconRow: {
    flexDirection: "row",
    paddingVertical: 12,
  },
  iconButton: {
    marginRight: 16,
  },
  keyboardAccessory: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingLeft: 64,
    gap: 12,
  },
  keyboardAccessoryText: {
    flex: 1,
    color: Colors.border,
  },
  submitButton: {
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  mediaContainer: {
    position: "relative",
    marginRight: 10,
    marginTop: 10,
  },
  deleteIconContainer: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    padding: 4,
  },
  mediaImage: {
    width: 100,
    height: 200,
    borderRadius: 6,
    marginRight: 10,
    marginTop: 10,
  },
});
