import {
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  RefreshControl,
} from "react-native";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link, useNavigation } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  runOnJS,
} from "react-native-reanimated";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Thread from "@/components/Thread";
import { Doc } from "@/convex/_generated/dataModel";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ThreadComposer from "@/components/ThreadComposer";
import { useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { Colors } from "@/constants/Colors";

const Page = () => {
  const { results, status, loadMore } = usePaginatedQuery(
    api.messages.getThreads,
    {},
    { initialNumItems: 5 }
  );
  const { top } = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const onLoadMore = () => {
    loadMore(5);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <Animated.FlatList
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        data={results}
        renderItem={({ item }) => (
          <Link href={`/feed/${item._id}` as any} asChild>
            <TouchableOpacity>
              <Thread
                thread={item as Doc<"messages"> & { creator: Doc<"users"> }}
              />
            </TouchableOpacity>
          </Link>
        )}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={{ paddingBottom: 16 }}>
            <Image
              source={require("@/assets/images/threads-logo-black.png")}
              style={{ width: 40, height: 40, alignSelf: "center" }}
            />
            <ThreadComposer isPreview />
          </View>
        }
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: StyleSheet.hairlineWidth,
              backgroundColor: Colors.border,
            }}
          />
        )}
        contentContainerStyle={{ paddingVertical: top }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

export default Page;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.itemBackground,
  },
});
