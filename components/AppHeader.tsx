import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../context/ThemeContext";
import { SCREEN_HORIZONTAL, SPACING, typography } from "../utils/theme";

type Props = {
  title: string;
};

/**
 * Unified in-screen title for Home, Goals list, and Profile main.
 */
export default function AppHeader({ title }: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.outer, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.inner,
          { backgroundColor: colors.background },
          {
            paddingTop: insets.top + SPACING.sm,
            paddingHorizontal: SCREEN_HORIZONTAL,
            paddingBottom: SPACING.sm + SPACING.xs,
          },
        ]}
      >
        <Text
          style={[styles.title, { color: colors.textPrimary }]}
          accessibilityRole="header"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      </View>
      <View
        style={[styles.divider, { backgroundColor: colors.border }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {},
  inner: {},
  title: {
    ...typography.header,
    textAlign: "left",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: "100%",
  },
});
