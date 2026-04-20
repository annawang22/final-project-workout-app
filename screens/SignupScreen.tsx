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
import { getUsers, saveUser, setActiveUser, setLoggedIn } from "../utils/storage";

type Props = NativeStackScreenProps<RootStackParamList, "Signup">;

export default function SignupScreen({ navigation }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const trimmedUsername = username.trim();
  const fieldsEmpty =
    trimmedUsername.length === 0 || password.length === 0;

  async function handleCreateAccount() {
    setError(null);

    if (fieldsEmpty) {
      setError("Please enter both username and password.");
      return;
    }

    const existing = await getUsers();
    if (existing.some((u) => u.username === trimmedUsername)) {
      setError("That username is already taken.");
      return;
    }

    await saveUser({ username: trimmedUsername, password });
    await setLoggedIn(true);
    await setActiveUser(trimmedUsername);
    navigation.reset({
      index: 0,
      routes: [{ name: "Main" }],
    });
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

        <Pressable
          style={styles.primaryBtn}
          onPress={() => void handleCreateAccount()}
        >
          <Text style={styles.primaryBtnText}>Create account</Text>
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
});
