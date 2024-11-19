import { Colors } from "@/constants/Colors";
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type TabsProps = {
  onTabChange: (tab: string) => void;
};

const Tabs = ({ onTabChange }: TabsProps) => {
  const [activeTab, setActiveTab] = useState("スレッド");

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    onTabChange(tab);
  };

  return (
    <View style={styles.container}>
      {["スレッド", "返信", "再投稿"].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => handleTabPress(tab)}
        >
          <Text
            style={[styles.tabText, activeTab === tab && styles.activeTabText]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Colors.itemBackground,
  },
  tab: {
    alignItems: "center",
    flex: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
  },
  tabText: {
    color: Colors.border,
  },
  activeTabText: {
    color: "white",
    fontWeight: "bold",
  },
  activeTab: {
    borderBottomColor: "white",
  },
});

export default Tabs;
