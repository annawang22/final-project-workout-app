import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { useTheme } from "../context/ThemeContext";

import { useTabBarProfile } from "./TabBarProfileContext";

type Props = {
  focused: boolean;
  color: string;
  size: number;
};

/**
 * Profile tab: current user's photo (from storage) or a default avatar icon.
 * Icon footprint matches `size` so the tab bar stays aligned with Home / Goals.
 */
export default function ProfileTabBarIcon({ focused, color: tint, size }: Props) {
  const { colors } = useTheme();
  const { profileTabImageUri } = useTabBarProfile();
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [profileTabImageUri]);

  const uri =
    profileTabImageUri != null && profileTabImageUri.length > 0
      ? profileTabImageUri
      : null;
  const showPhoto = uri != null && !loadFailed;

  if (!showPhoto) {
    return (
      <Ionicons
        name={focused ? "person-circle" : "person-circle-outline"}
        size={size}
        color={tint}
      />
    );
  }

  const dim = Math.round(size);
  const radius = dim / 2;

  return (
    <View
      style={[
        styles.clip,
        { backgroundColor: colors.card },
        {
          width: dim,
          height: dim,
          borderRadius: radius,
          opacity: focused ? 1 : 0.72,
        },
      ]}
    >
      <Image
        recyclingKey={uri}
        source={{ uri }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        onError={() => setLoadFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: "hidden",
  },
});
