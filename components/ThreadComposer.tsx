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
  KeyboardAvoidingView,
  Platform,
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

  /**
   * スレッドを送信する
   * @returns {Promise<void>}
   */
  const handleSubmit = async () => {
    // メディアファイルをアップロードし、ストレージIDを取得
    const mediaStorageIds = await Promise.all(
      mediaFiles.map(async (file) => uploadMediaFile(file))
    );

    // スレッドを追加
    addThread({
      threadId,
      content: threadContent,
      mediaFiles: mediaStorageIds,
    });

    // 状態をリセットし、モーダルを閉じる
    setThreadContent("");
    setMediaFiles([]);
    router.dismiss();
  };

  /**
   * スレッドの内容をクリアする
   */
  const removeThread = () => {
    setThreadContent("");
    setMediaFiles([]);
  };

  /**
   * キャンセル処理を行う
   * ユーザーに確認を求めるアラートを表示
   */
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

  /**
   * 画像を選択する
   * @param {('library'|'camera')} source - 画像のソース
   * @returns {Promise<void>}
   */
  const selectImage = async (source: "library" | "camera") => {
    const options: ImagePicker.ImagePickerOptions = {
      allowsEditing: true,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    };

    let result;

    if (source === "camera") {
      // カメラの権限を要求
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled) {
      setMediaFiles([result.assets[0], ...mediaFiles]);
    }
  };

  /**
   * 選択した画像を削除する
   * @param {number} index - 削除する画像のインデックス
   */
  const removeImage = (index: number) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
  };

  /**
   * メディアファイルをアップロードする
   * @param {ImagePicker.ImagePickerAsset} image - アップロードする画像
   * @returns {Promise<string>} アップロードされたファイルのストレージID
   */
  const uploadMediaFile = async (image: ImagePicker.ImagePickerAsset) => {
    // アップロードURLを生成
    const postUrl = await generateUploadUrl();

    // 画像をBlobに変換
    const response = await fetch(image.uri);
    const blob = await response.blob();

    // 画像をアップロード
    const result = await fetch(postUrl, {
      method: "POST",
      headers: {
        "Content-Type": image.mimeType!,
      },
      body: blob,
    });

    // レスポンスからストレージIDを取得
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

      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <View style={[styles.keyboardAccessory]}>
            <Text style={[styles.keyboardAccessoryText, { color: "#fff" }]}>
              {isReply
                ? "誰でも返信・引用できます"
                : "フォローしているプロフィールのみ返信・引用できます"}
            </Text>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={[styles.submitButtonText, { color: "#fff" }]}>
                Post
              </Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}

      {Platform.OS === "android" && !isPreview && (
        <KeyboardAvoidingView behavior="padding">
          <View style={[styles.keyboardAccessory]}>
            <Text style={[styles.keyboardAccessoryText, { color: "#fff" }]}>
              {isReply
                ? "誰でも返信・引用できます"
                : "あなたがフォロー中のプロフィールは返信・引用できます"}
            </Text>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={[styles.submitButtonText, { color: "#fff" }]}>
                投稿
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
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
    paddingLeft: 16,
    gap: 12,
  },
  keyboardAccessoryText: {
    flex: 1,
    color: Colors.border,
    fontSize: 12,
    textAlign: "left",
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
    width: 150,
    height: 300,
    borderRadius: 6,
    marginRight: 10,
    marginTop: 10,
    resizeMode: "contain",
  },
});
