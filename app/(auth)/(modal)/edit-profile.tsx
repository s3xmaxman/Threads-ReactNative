import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import * as ImagePicker from "expo-image-picker";

const Page = () => {
  const { biostring, linkstring, userId, imageUrl } = useLocalSearchParams<{
    biostring: string;
    linkstring: string;
    userId: string;
    imageUrl: string;
  }>();

  const [bio, setBio] = useState(biostring);
  const [link, setLink] = useState(linkstring);
  const [selectedImage, setSelectedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const router = useRouter();

  const updateUser = useMutation(api.users.updateUser);
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const updateImage = useMutation(api.users.updateImage);

  /**
   * プロフィールの変更を保存し、画面を閉じる
   */
  const onDone = async () => {
    // ユーザー情報を更新
    await updateUser({
      _id: userId as Id<"users">,
      bio,
      websiteUrl: link,
    });

    // 新しいプロフィール画像が選択されている場合、アップロードする
    if (selectedImage) {
      await updateProfilePicture();
    }

    // 画面を閉じる
    router.dismiss();
  };

  /**
   * プロフィール画像を更新する
   */
  const updateProfilePicture = async () => {
    // アップロード用URLを生成
    const postUrl = await generateUploadUrl();

    // 選択された画像をBlobに変換
    const response = await fetch(selectedImage!.uri);
    const blob = await response.blob();

    // 画像をアップロード
    const result = await fetch(postUrl, {
      method: "POST",
      headers: {
        "Content-Type": selectedImage!.mimeType!,
      },
      body: blob,
    });

    // アップロードされた画像のストレージIDを取得
    const { storageId } = await result.json();

    // ユーザーのプロフィール画像を更新
    await updateImage({
      _id: userId as Id<"users">,
      storageId,
    });
  };

  /**
   * ギャラリーから画像を選択する
   */
  const selectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
    });
    // 画像が選択された場合、stateを更新
    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  return (
    <View>
      <Stack.Screen />
      <TouchableOpacity onPress={selectImage}>
        {selectedImage ? (
          <Image source={{ uri: selectedImage.uri }} style={styles.image} />
        ) : (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        )}
      </TouchableOpacity>
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
