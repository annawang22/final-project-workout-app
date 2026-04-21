import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Use for content that should align with the left edge of `AppHeader` titles. */
export const APP_HEADER_HORIZONTAL = 16;

const TITLE_FONT_SIZE = 22;
const TITLE_FONT_WEIGHT: "700" = "700";
const SAFE_EXTRA_TOP = 8;
const TITLE_BOTTOM = 12;
const DIVIDER_COLOR = "#e5e5ea";

type Props = {
  title: string;
};

/**
 * Unified in-screen title for Home, Goals list, and Profile main.
 * Safe area, typography, and divider are defined only here (UI Phase 2).
 */
export default function AppHeader({ title }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.outer}>
      <View
        style={[
          styles.inner,
          {
            paddingTop: insets.top + SAFE_EXTRA_TOP,
            paddingHorizontal: APP_HEADER_HORIZONTAL,
            paddingBottom: TITLE_BOTTOM,
          },
        ]}
      >
        <Text
          style={styles.title}
          accessibilityRole="header"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      </View>
      <View style={[styles.divider, { backgroundColor: DIVIDER_COLOR }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: "#fff",
  },
  inner: {
    backgroundColor: "#fff",
  },
  title: {
    fontSize: TITLE_FONT_SIZE,
    fontWeight: TITLE_FONT_WEIGHT,
    color: "#222",
    textAlign: "left",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },
});
