import { useContext, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import BackgroundLayout from "../components/BackgroundLayout";
// import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";

import { doc, setDoc } from "firebase/firestore";
import { db, secondaryAuth } from "../../firebaseConfig";
import { AuthContext } from "../context/AuthContext";

export default function AddStaffScreen() {
  const { role, user, dept } = useContext(AuthContext);

  /* 🔐 SECURITY: ONLY HOD */
  if (role !== "hod") {
    return (
      <View style={styles.center}>
        <Text>You are not authorized to access this screen</Text>
      </View>
    );
  }

  /* ================= STATE ================= */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= ADD STAFF ================= */
  const addStaff = async () => {
    if (!name || !email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      // ✅ CREATE STAFF AUTH (WITHOUT LOGGING OUT HOD)
      const cred = await createUserWithEmailAndPassword(
        secondaryAuth,
        email.trim(),
        password
      );

      const uid = cred.user.uid;

      // ✅ SAVE STAFF PROFILE (NO year / section)
      await setDoc(doc(db, "users", uid), {
        uid,
        name,
        email,
        role: "staff",               // staff belongs to HOD dept
        isActive: true,
        createdAt: Date.now(),
        createdBy: user.email,
      });

      // optional cleanup
      await signOut(secondaryAuth);

      Alert.alert("Success", "Staff added successfully");

      // reset form
      setName("");
      setEmail("");
      setPassword("");

    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <BackgroundLayout>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Add Staff</Text>

        <Text style={styles.sub}>
          Department: <Text style={{ fontWeight: "700" }}>{dept}</Text>
        </Text>

        <TextInput
          label="Staff Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={addStaff}
          loading={loading}
          disabled={loading}
          style={styles.btn}
        >
          Add Staff
        </Button>
      </ScrollView>
    </BackgroundLayout>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 10,
  },
  sub: {
    fontSize: 14,
    marginBottom: 20,
    color: "#555",
  },
  input: {
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  btn: {
    marginTop: 10,
  },
});
