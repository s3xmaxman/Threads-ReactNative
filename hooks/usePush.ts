import { useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Id } from "@/convex/_generated/dataModel";

/**
 * プッシュ通知の管理を行うカスタムフック
 *
 * このフックは以下の機能を提供します：
 * - プッシュ通知のデバイストークンの登録
 * - 通知受信時のハンドリング
 * - 通知タップ時のナビゲーション処理
 *
 * @returns void
 */
export const usePush = () => {
  // 通知リスナーの参照を保持
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  const router = useRouter();
  const updateUser = useMutation(api.users.updateUser);
  const { userProfile } = useUserProfile();

  useEffect(() => {
    // 実機でない場合は処理をスキップ
    if (!Device.isDevice) return;

    // プッシュ通知トークンの登録処理
    registerForPushNotificationsAsync()
      .then((token) => {
        // トークンとユーザープロファイルが存在する場合、ユーザー情報を更新
        if (token && userProfile?._id) {
          updateUser({
            pushToken: token,
            _id: userProfile?._id as Id<"users">,
          });
        }
      })
      .catch((error: any) => console.log("error", error));

    // 通知受信時のリスナー設定
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("received notification", notification);
      });

    // 通知タップ時のリスナー設定
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        // 通知データからスレッドIDを取得
        const threadId = response.notification.request.content.data.threadId;
        console.log(
          "🚀 ~ responseListener.current=Notifications.addNotificationResponseReceivedListener ~ threadId:",
          threadId
        );
        router.push(`/feed/${threadId}`);
      });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [userProfile?._id]);

  // プッシュ通知のハンドラー設定
  // 通知を受信した際の動作を定義
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  /**
   * プッシュ通知の登録エラーを処理する
   * @param {string} errorMessage - エラーメッセージ
   */
  function handleRegistrationError(errorMessage: string) {
    alert(errorMessage);
    throw new Error(errorMessage);
  }

  /**
   * プッシュ通知の登録を非同期で行う
   * @returns {Promise<string | undefined>} プッシュトークン
   */
  async function registerForPushNotificationsAsync() {
    // Androidの場合、通知チャンネルを設定
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    // 物理デバイスでのみ実行
    if (Device.isDevice) {
      // 既存の権限状態を取得
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // 権限が付与されていない場合、リクエスト
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // 最終的に権限が付与されなかった場合、エラー
      if (finalStatus !== "granted") {
        handleRegistrationError(
          "Permission not granted to get push token for push notification!"
        );
        return;
      }

      // プロジェクトIDの取得
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;
      if (!projectId) {
        handleRegistrationError("Project ID not found");
      }

      try {
        // プッシュトークンの取得
        const pushTokenString = (
          await Notifications.getExpoPushTokenAsync({ projectId })
        ).data;
        console.log(pushTokenString);
        return pushTokenString;
      } catch (e: unknown) {
        handleRegistrationError(`${e}`);
      }
    } else {
      handleRegistrationError(
        "Must use physical device for push notifications"
      );
    }
  }
};
