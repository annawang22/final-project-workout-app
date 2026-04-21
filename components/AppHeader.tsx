import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  COLORS,
  SCREEN_HORIZONTAL,
  SPACING,
  typography,
} from "../utils/theme";

type Props = {
  title: string;
};

/**
 * Unified in-screen title for Home, Goals list, and Profile main.
 * Tokens from `utils/theme.js` (UI Phase 3).
 */
export default function AppHeader({ title }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.outer}>
      <View
        style={[
          styles.inner,
          {
            paddingTop: insets.top + SPACING.sm,
            paddingHorizontal: SCREEN_HORIZONTAL,
            paddingBottom: SPACING.sm + SPACING.xs,
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
      <View style={[styles.divider, { backgroundColor: COLORS.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: COLORS.background,
  },
  inner: {
    backgroundColor: COLORS.background,
  },
  title: {
    ...typography.header,
    color: COLORS.textPrimary,
    textAlign: "left",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },
});
