import { collection, getDocs, query, where } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { Appbar, Card, Chip, Text } from "react-native-paper";
import { db } from "../../firebaseConfig";
import { AuthContext } from "../context/AuthContext";


export default function ViewAttendanceScreen({ navigation }) {
  const { linkedStudentId, logout } = useContext(AuthContext);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Stats
  const [present, setPresent] = useState(0);
  const [absent, setAbsent] = useState(0);
  const [late, setLate] = useState(0);
  const [od, setOd] = useState(0);
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    fetchAttendance();
  }, [linkedStudentId]);

  const fetchAttendance = async () => {
    if (!linkedStudentId) return;

    setLoading(true);

    try {
      const q = query(
        collection(db, "attendance"),
        where("studentId", "==", linkedStudentId)
      );

      const snap = await getDocs(q);
      const arr = [];

      snap.forEach((doc) => {
        const d = doc.data();
        if (d.periods) {
          // New Schema: One Doc Per Day -> Flatten to multiple rows
          Object.keys(d.periods).forEach(pKey => {
            const pData = d.periods[pKey];
            arr.push({
              id: `${doc.id}_${pKey}`,
              date: d.date,
              period: pKey,
              status: pData.status,
              // include other meta if needed
            });
          });
        } else {
          // Old Schema: One Doc Per Period
          arr.push({ id: doc.id, ...d });
        }
      });

      setRows(arr);

      // Calculate Stats
      calculateStats(arr);
    } catch (err) {
      console.log("Error fetching attendance:", err);
    }

    setLoading(false);
  };

  const calculateStats = (list) => {
    const presentCount = list.filter((x) => x.status === "present").length;
    const absentCount = list.filter((x) => x.status === "absent").length;
    const lateCount = list.filter((x) => x.status === "late").length;
    const odCount = list.filter((x) => x.status === "od").length;

    const total = list.length;

    setPresent(presentCount);
    setAbsent(absentCount);
    setLate(lateCount);
    setOd(odCount);
    setPercentage(total === 0 ? 0 : Math.round((presentCount / total) * 100));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAttendance();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "present":
        return "#4CAF50";
      case "absent":
        return "#FF5252";
      case "late":
        return "#FFC107";
      case "od":
        return "#42A5F5";
      default:
        return "#9E9E9E";
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        {/* <Appbar.BackAction onPress={() => navigation.goBack()} color="#fff" />
        <Appbar.Content title="My Attendance" titleStyle={styles.headerTitle} /> */}
      </Appbar.Header>

      {/* Stats Section */}
      <View style={styles.statsWrapper}>
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, styles.statPresent]}>
            <Text style={styles.statLabel}>Present</Text>
            <Text style={[styles.statValue, { color: '#2E7D32' }]}>{present}</Text>
          </View>

          <View style={[styles.statBox, styles.statAbsent]}>
            <Text style={styles.statLabel}>Absent</Text>
            <Text style={[styles.statValue, { color: '#C62828' }]}>{absent}</Text>
          </View>

          <View style={[styles.statBox, styles.statLate]}>
            <Text style={styles.statLabel}>Late</Text>
            <Text style={[styles.statValue, { color: '#F57F17' }]}>{late}</Text>
          </View>

          <View style={[styles.statBox, styles.statOD]}>
            <Text style={styles.statLabel}>OD</Text>
            <Text style={[styles.statValue, { color: '#1565C0' }]}>{od}</Text>
          </View>
        </View>

        {/* Percentage */}
        <View style={styles.percentBox}>
          <Text style={styles.percentText}>{percentage > 0 ? percentage : 0}%</Text>
          <Text style={styles.percentLabel}>Total Attendance</Text>
        </View>
      </View>

      {/* Loading */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#5A67D8" />
          <Text style={styles.loadingText}>Loading Attendance...</Text>
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No attendance records found.</Text>
        </View>
      ) : (
        <FlatList
          data={Object.values(rows.reduce((acc, curr) => {
            // Group by date
            if (!acc[curr.date]) acc[curr.date] = { date: curr.date, periods: {} };
            acc[curr.date].periods[curr.period] = curr;
            return acc;
          }, {})).sort((a, b) => b.date.localeCompare(a.date))}
          keyExtractor={(item) => item.date}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#5A67D8"]} />
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.dateRow}>
                  <Text style={styles.date}>{item.date}</Text>
                  <Chip textStyle={{ fontSize: 10, marginVertical: -4 }}>Regular</Chip>
                </View>

                <View style={styles.divider} />

                <View style={styles.periodGrid}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(pId => {
                    const rec = item.periods[pId?.toString()];
                    const status = rec ? rec.status : '-';
                    const color = rec ? getStatusColor(rec.status) : '#e0e0e0';
                    const isPresent = status?.toLowerCase() === 'present';

                    return (
                      <View key={pId} style={styles.periodColumn}>
                        <View style={[styles.periodBadge, {
                          backgroundColor: isPresent ? '#E8F5E9' : color === '#e0e0e0' ? '#F5F5F5' : color,
                          borderColor: isPresent ? '#C8E6C9' : 'transparent',
                          borderWidth: isPresent ? 1 : 0
                        }]}>
                          <Text style={[styles.periodText, { color: isPresent ? '#2E7D32' : '#fff' }]}>{pId}</Text>
                        </View>
                        <Text style={styles.statusText}>{status.charAt(0).toUpperCase()}</Text>
                      </View>
                    );
                  })}
                </View>
              </Card.Content>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#5A67D8',
    elevation: 4,
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  statsWrapper: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    paddingBottom: 20,
    marginBottom: 10,
    zIndex: 10,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingTop: 20,
    paddingHorizontal: 10,
    flexWrap: 'wrap',
  },
  statBox: {
    alignItems: "center",
    justifyContent: 'center',
    width: '22%',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  statPresent: { backgroundColor: '#E8F5E9' },
  statAbsent: { backgroundColor: '#FFEBEE' },
  statLate: { backgroundColor: '#FFF8E1' },
  statOD: { backgroundColor: '#E3F2FD' },

  statLabel: {
    fontSize: 12,
    color: "#546E7A",
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  percentBox: {
    alignItems: "center",
    marginTop: 10,
  },
  percentText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#37474F",
  },
  percentLabel: {
    fontSize: 14,
    color: "#78909C",
    fontWeight: '500',
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: '#F1F3F4',
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  date: {
    fontSize: 18,
    fontWeight: "700",
    color: "#263238",
  },
  divider: {
    height: 1,
    backgroundColor: '#ECEFF1',
    marginBottom: 16,
  },
  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#90A4AE",
    fontWeight: '500',
  },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#5A67D8',
    fontWeight: '500',
  },
  periodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  periodColumn: {
    alignItems: 'center',
    width: '12%',
    marginBottom: 8,
  },
  periodBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusText: {
    fontSize: 11,
    color: '#546E7A',
    fontWeight: '600',
  }
});
