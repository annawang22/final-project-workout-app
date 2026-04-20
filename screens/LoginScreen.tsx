import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { RootStackParamList } from "../navigation/types";
import { findUserByCredentials, setLoggedIn } from "../utils/storage";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
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
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
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

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 16,
  },
  error: {
    color: "#c00",
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: "#222",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  linkWrap: {
    marginTop: 16,
    alignItems: "center",
  },
  link: {
    color: "#06c",
    fontSize: 16,
  },
});
