import DateTimePicker from "@react-native-community/datetimepicker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import BackgroundLayout from "../components/BackgroundLayout";

import { Button } from "react-native-paper";
import HybridDropdown from "../components/HybridDropdown";
import { DEPARTMENTS, SECTIONS, YEARS } from "../constants";
import { fetchAttendanceByFilters } from "../services/attendanceService";
import { toCSV } from "../utils/csv";

export default function ExportDataScreen() {
  const [filters, setFilters] = useState({
    dept: "",
    year: "",
    section: "",
  });

  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatDate = (d) => (d ? d.toISOString().slice(0, 10) : "");

  const runExport = async () => {
    try {
      setLoading(true);

      const rows = await fetchAttendanceByFilters({
        from: from ? formatDate(from) : null,
        to: to ? formatDate(to) : null,
        ...filters,
      });

      if (!rows || rows.length === 0) {
        Alert.alert("No Data", "No attendance records found.");
        return;
      }

      const csv = toCSV(rows);

      // ✅ Mobile safe download (no web URL usage)
      const fileUri =
        FileSystem.cacheDirectory + `attendance_${Date.now()}.csv`;

      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: 'utf8',
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Saved", "CSV saved to: " + fileUri);
      }
    } catch (e) {
      console.log("Export Error Details:", e);
      Alert.alert("Error", e.message || "Export failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundLayout>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Export Attendance Data</Text>
        <Text style={styles.subtitle}>Filter and download data</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Filters</Text>

          <HybridDropdown
            label="Department"
            value={filters.dept}
            onChangeText={(t) => setFilters({ ...filters, dept: t })}
            options={DEPARTMENTS}
            placeholder="Department"
          />

          <HybridDropdown
            label="Year"
            value={filters.year}
            onChangeText={(t) => setFilters({ ...filters, year: t })}
            options={YEARS}
            placeholder="Year"
          />

          <HybridDropdown
            label="Section"
            value={filters.section}
            onChangeText={(t) => setFilters({ ...filters, section: t })}
            options={SECTIONS}
            placeholder="Section"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Date Range</Text>

          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowFrom(true)}
          >
            <Text>{from ? from.toDateString() : "From Date"}</Text>
          </TouchableOpacity>

          {showFrom && (
            <DateTimePicker
              mode="date"
              value={from || new Date()}
              onChange={(e, d) => {
                setShowFrom(false);
                if (d) setFrom(d);
              }}
            />
          )}

          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowTo(true)}
          >
            <Text>{to ? to.toDateString() : "To Date"}</Text>
          </TouchableOpacity>

          {showTo && (
            <DateTimePicker
              mode="date"
              value={to || new Date()}
              onChange={(e, d) => {
                setShowTo(false);
                if (d) setTo(d);
              }}
            />
          )}
        </View>

        <Button
          mode="contained"
          onPress={runExport}
          loading={loading}
          style={styles.exportBtn}
        >
          {loading ? "Exporting..." : "Export CSV"}
        </Button>

        <View style={{ height: 40 }} />
      </ScrollView>
    </BackgroundLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#555", marginBottom: 12 },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  dateBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  exportBtn: {
    marginTop: 10,
    borderRadius: 10,
  },
});
