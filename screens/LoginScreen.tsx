import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTheme } from "../context/ThemeContext";
import type { RootStackParamList } from "../navigation/types";
import {
  findUserByCredentials,
  setActiveUser,
  setLoggedIn,
} from "../utils/storage";
import { createAuthFormStyles } from "../utils/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createAuthFormStyles(colors), [colors]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const trimmedUsername = username.trim();
  const fieldsEmpty =
    trimmedUsername.length === 0 || password.length === 0;

  async function handleLogin() {
    setError(null);

    if (fieldsEmpty) {
      setError("Please enter both username and password.");
      return;
    }

    const stored = await findUserByCredentials(trimmedUsername, password);
    if (stored) {
      await setLoggedIn(true);
      await setActiveUser(stored.username);
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
      return;
    }

    setError("Invalid username or password.");
  }

  function goSignup() {
    setError(null);
    navigation.navigate("Signup");
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          placeholderTextColor={colors.placeholder}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.placeholder}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.primaryBtn} onPress={() => void handleLogin()}>
          <Text style={styles.primaryBtnText}>Log in</Text>
        </Pressable>

        <Pressable style={styles.linkWrap} onPress={goSignup}>
          <Text style={styles.link}>Sign up</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
