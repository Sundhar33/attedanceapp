import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import BackgroundLayout from "../components/BackgroundLayout";
import { parseStudentExcel } from "../utils/excelParser";

import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import HybridDropdown from "../components/HybridDropdown";
import { DEPARTMENTS, SECTIONS, YEARS } from "../constants";

export default function AddStudentScreen() {
  // Manual form fields
  const [name, setName] = useState("");
  const [regNo, setRegNo] = useState("");
  const [dept, setDept] = useState("");
  const [year, setYear] = useState("");
  const [section, setSection] = useState("");
  const [parentContact, setParentContact] = useState("");

  const [excelUploading, setExcelUploading] = useState(false);

  // -----------------------------
  //   📌 MANUAL ADD STUDENT
  // -----------------------------
  const addStudent = async () => {
    if (!name || !regNo || !dept || !year || !section) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      // Use Register Number as the Unique ID
      const uid = regNo.trim().toUpperCase();

      await setDoc(doc(db, "students", uid), {
        name: name.trim(),
        regNo: uid, // storing uppercase regNo
        dept,
        year,
        section,
        parentContact,
        createdAt: Date.now(),
        // Optional: store email if you want, derived from regNo or input
        email: `${uid}@dsengg.ac.in`
      });

      Alert.alert(
        "Success",
        `Student added successfully!\n\nID: ${uid}`
      );

      // Reset
      setName("");
      setRegNo("");
      setDept("");
      setYear("");
      setSection("");
      setParentContact("");
    } catch (error) {
      console.log("Add Student Error", error);
      Alert.alert("Error", `Failed: ${error.message}`);
    }
  };

  // -----------------------------
  //   📌 EXCEL UPLOAD BULK ADD
  // -----------------------------
  const handleExcelUpload = async () => {
    try {
      const file = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ],
      });

      if (file.canceled) return;

      setExcelUploading(true);

      const rows = await parseStudentExcel(file.assets[0].uri);

      const validEntries = [];
      let invalidCount = 0;

      // 1. Analyze Data
      for (let r of rows) {
        let name = r.Name;
        let regNo = r.RegNo; // vital
        let dept = r.Dept;
        let year = r.Year;
        let section = r.Section;

        // Normalize Data
        if (name) name = String(name).trim();
        if (regNo) regNo = String(regNo).trim().toUpperCase();
        if (dept) dept = String(dept).trim(); // e.g. "AI&DS"
        if (year) year = String(year).trim(); // e.g. "IV"
        if (section) section = String(section).trim().toUpperCase(); // "a" -> "A"

        if (!name || !regNo || !dept || !year || !section) {
          invalidCount++;
        } else {
          validEntries.push({
            original: r,
            normalized: { name, regNo, dept, year, section },
          });
        }
      }

      // 2. Prompt User
      Alert.alert(
        "Verify Excel Data",
        `Valid Entries: ${validEntries.length}\nInvalid Entries: ${invalidCount}\n\nProceed to add ${validEntries.length} students?`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => setExcelUploading(false),
          },
          {
            text: "OK",
            onPress: () => uploadValidEntries(validEntries, invalidCount),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", error.message);
      setExcelUploading(false);
    }
  };

  const uploadValidEntries = async (entries, invalidCount) => {
    let success = 0;
    let failed = 0;

    for (let entry of entries) {
      try {
        const { name, regNo, dept, year, section } = entry.normalized;

        // Use Register Number as ID
        const uid = regNo;

        // Auto-generate email just for record (not for auth)
        const email = entry.original.Email || `${regNo}@dsengg.ac.in`;

        await setDoc(doc(db, "students", uid), {
          name,
          regNo,
          dept,
          year,
          section,
          email,
          createdAt: Date.now(),
        });

        success++;
      } catch (err) {
        console.error("Row failed:", entry.original, err);
        failed++;
      }
    }

    setExcelUploading(false);

    Alert.alert(
      "Bulk Upload Complete",
      `✔ Added: ${success}\n✖ Failed: ${failed}\n⚠ Invalid/Skipped: ${invalidCount}`
    );
  };

  // ------------------------------
  //   UI
  // ------------------------------
  return (
    <BackgroundLayout>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">


        {/* Bulk Upload */}
        <Button
          mode="contained"
          onPress={handleExcelUpload}
          loading={excelUploading}
          style={styles.excelBtn}
        >
          Upload Excel (.xlsx)
        </Button>

        <Text style={styles.note}>
          📌 Columns Required:
          Name | RegNo | Dept | Year | Section | (Email & Password Optional)
        </Text>

        <View style={styles.divider} />

        {/* Manual Add */}
        <Text style={styles.subtitle}>Add Manually</Text>

        {/* Name */}
        <TextInput
          style={styles.input}
          label="Student Name *"
          value={name}
          onChangeText={setName}
        />

        {/* Reg No */}
        <TextInput
          style={styles.input}
          label="Register Number *"
          value={regNo}
          onChangeText={(text) => setRegNo(text.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          autoCapitalize="characters"
        />

        {/* Dept */}
        <HybridDropdown
          label="Department *"
          value={dept}
          onChangeText={setDept}
          options={DEPARTMENTS}
          placeholder="Select Department"
        />

        {/* Year */}
        <HybridDropdown
          label="Year *"
          value={year}
          onChangeText={setYear}
          options={YEARS}
          placeholder="Select Year"
          maxHeight={200}
        />

        {/* Section */}
        <HybridDropdown
          label="Section *"
          value={section}
          onChangeText={setSection}
          options={SECTIONS}
          placeholder="Select Section"
          maxHeight={200}
        />

        {/* Parent Contact */}
        <TextInput
          style={styles.input}
          label="Parent Mobile / Email"
          value={parentContact}
          onChangeText={setParentContact}
          placeholder="For notifications"
        />

        {/* Info Note */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Credentials will be auto-generated:
          </Text>
          <Text style={styles.infoDetail}>Email: {regNo || "REGNO"}@dsengg.ac.in</Text>
          <Text style={styles.infoDetail}>Password: {regNo || "REGNO"}</Text>
        </View>

        <Button mode="contained" style={styles.addBtn} onPress={addStudent}>
          Add Student
        </Button>
      </ScrollView>
    </BackgroundLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  addBtn: {
    marginTop: 10,
    backgroundColor: "#007AFF",
  },
  excelBtn: {
    backgroundColor: "#0A84FF",
    marginBottom: 10,
  },
  note: {
    fontSize: 13,
    color: "#555",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 20,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3'
  },
  infoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0D47A1',
    marginBottom: 4
  },
  infoDetail: {
    fontSize: 13,
    color: '#1565C0',
    fontFamily: 'monospace'
  }
});
