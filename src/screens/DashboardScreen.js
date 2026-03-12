import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { doc, getDoc } from "firebase/firestore";
import {
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { db } from "../../firebaseConfig";
import BackgroundLayout from "../components/BackgroundLayout";
import HybridDropdown from "../components/HybridDropdown";
import { PERIODS } from "../constants";
import { fetchDistinctFilters, fetchSections } from "../services/studentService";

const CARD_HEIGHT = 120;

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    od: 0,
    totalStudents: 0,
    percentage: 0,
  });

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const [filterDept, setFilterDept] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("1");

  const [departments, setDepartments] = useState([]);
  const [years, setYears] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDistinctFilters().then(({ departments: d, years: y }) => {
      setDepartments(d);
      setYears(y);
    });
  }, []);

  useEffect(() => {
    if (filterDept && filterYear) {
      fetchSections(filterDept, filterYear).then(setSectionsList);
    } else {
      setSectionsList([]);
    }
  }, [filterDept, filterYear]);

  /* ---------- ONLY FETCH FROM daily_dashboard ---------- */

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const formattedDate = date.toISOString().split("T")[0];
      const ref = doc(db, "daily_dashboard", formattedDate);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setStats({ present: 0, absent: 0, late: 0, od: 0, totalStudents: 0, percentage: 0 });
        // Alert.alert("No Data", "No attendance marked for this date");
        return;
      }

      const data = snap.data();

      let present = 0;
      let absent = 0;
      let late = 0;
      let od = 0;
      let total = 0;

      // Helper to aggregate stats
      const addStats = (pData) => {
        present += pData.present || 0;
        absent += pData.absent || 0;
        late += pData.late || 0;
        od += pData.od || 0;
        total += pData.total || 0;
      };

      // Traversal Functions
      const processPeriods = (sectionData) => {
        if (!sectionData) return;
        Object.keys(sectionData).forEach(pKey => {
          // FIX: Respect filterPeriod
          if (!filterPeriod || pKey === filterPeriod) {
            addStats(sectionData[pKey]);
          }
        });
      };

      const processSections = (yearData) => {
        if (!yearData) return;
        Object.keys(yearData).forEach(sKey => {
          if (!filterSection || sKey === filterSection) {
            processPeriods(yearData[sKey]);
          }
        });
      };

      const processYears = (deptData) => {
        if (!deptData) return;
        Object.keys(deptData).forEach(yKey => {
          if (!filterYear || yKey === filterYear) {
            processSections(deptData[yKey]);
          }
        });
      };

      // Start Root Traversal
      Object.keys(data).forEach(dKey => {
        if (dKey === 'createdAt') return; // skip metadata
        if (!filterDept || dKey === filterDept) {
          processYears(data[dKey]);
        }
      });

      const percentage =
        total > 0 ? Math.round(((present + od) / total) * 100) : 0;

      setStats({
        present,
        absent,
        late,
        od,
        totalStudents: total,
        percentage,
      });

    } catch (e) {
      console.log(e);
      // Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadDashboard();
  }, [date, filterDept, filterYear, filterSection, filterPeriod]);

  /* ---------- UI SAME AS OLD ---------- */

  const onChangeDate = (_, selected) => {
    setShowPicker(false);
    setDate(selected || date);
  };

  const renderCard = (label, value, colors) => (
    <LinearGradient colors={colors} style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </LinearGradient>
  );

  return (
    <BackgroundLayout style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.dateBox}>
          <Text style={styles.dateLabel}>Selected Date</Text>
          <TouchableOpacity onPress={() => setShowPicker(true)}>
            <Text style={styles.dateValue}>
              {date.toISOString().split("T")[0]}
            </Text>
          </TouchableOpacity>
        </View>

        {showPicker && (
          <DateTimePicker value={date} mode="date" onChange={onChangeDate} />
        )}

        <HybridDropdown label="Period" value={filterPeriod}
          onChangeText={setFilterPeriod}
          options={PERIODS.map(p => p.id.toString())} />

        <HybridDropdown label="Department" value={filterDept}
          onChangeText={setFilterDept}
          options={departments} />

        <HybridDropdown label="Year" value={filterYear}
          onChangeText={setFilterYear}
          options={years} />

        <HybridDropdown label="Section" value={filterSection}
          onChangeText={setFilterSection}
          options={sectionsList} />

        {loading && <ActivityIndicator size="large" style={{ marginVertical: 20 }} />}

        <View style={styles.grid}>
          {renderCard("Total Students", stats.totalStudents, ["#4c669f", "#3b5998"])}
          {renderCard("Present", stats.present, ["#11998e", "#38ef7d"])}
          {renderCard("Absent", stats.absent, ["#cb2d3e", "#ef473a"])}
          {renderCard("Late", stats.late, ["#f7971e", "#ffd200"])}
          {renderCard("OD", stats.od, ["#2193b0", "#6dd5ed"])}
          {renderCard("Percentage", `${stats.percentage}%`, ["#8E2DE2", "#4A00E0"])}
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate("MarkAttendance")}
        >
          <Text style={styles.btnText}>Mark Attendance</Text>
        </TouchableOpacity>
      </ScrollView>
    </BackgroundLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  scrollContent: { padding: 16 },
  dateBox: { backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  dateLabel: { fontSize: 13, color: "#666" },
  dateValue: { fontSize: 18, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 20 },
  card: { width: "48%", height: CARD_HEIGHT, marginBottom: 12, borderRadius: 16, padding: 16, justifyContent: "space-between" },
  cardLabel: { color: "#fff", fontSize: 14 },
  cardValue: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  btn: { marginTop: 24, padding: 16, borderRadius: 12, backgroundColor: "#007AFF" },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "700" },
});
