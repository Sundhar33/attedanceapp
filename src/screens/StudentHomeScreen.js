import { LinearGradient } from "expo-linear-gradient";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useContext, useEffect, useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { Avatar, Button, Card, Text } from "react-native-paper";
import { db } from "../../firebaseConfig";
import { AuthContext } from "../context/AuthContext";

export default function StudentHomeScreen({ navigation }) {
  const { logout, user, linkedStudentId } = useContext(AuthContext);
  const [studentName, setStudentName] = useState("Student");
  const [stats, setStats] = useState({ percentage: 0, present: 0, total: 0 });

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, [linkedStudentId]);

  const fetchProfile = async () => {
    if (linkedStudentId) {
      const snap = await getDoc(doc(db, "students", linkedStudentId));
      if (snap.exists()) {
        setStudentName(snap.data().name);
      }
    }
  };

  const fetchStats = async () => {
    if (!linkedStudentId) return;
    try {
      const q = query(
        collection(db, "attendance"),
        where("studentId", "==", linkedStudentId)
      );
      const snap = await getDocs(q);

      let totalClasses = 0;
      let presentCount = 0;

      snap.forEach(d => {
        const data = d.data();

        if (data.periods) {
          // New Structure: One Doc Per Day (Multiple Periods)
          Object.values(data.periods).forEach(p => {
            totalClasses++;
            if (p.status === 'present' || p.status === 'od') {
              presentCount++;
            }
          });
        } else if (data.status) {
          // Old Structure: One Doc Per Period
          totalClasses++;
          if (data.status === 'present' || data.status === 'od') {
            presentCount++;
          }
        }
      });

      setStats({
        present: presentCount,
        total: totalClasses,
        percentage: totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0
      });
    } catch (e) {
      console.log('Stats Error:', e);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Section */}
        <LinearGradient
          colors={['#6a11cb', '#2575fc']}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.welcome}>Welcome back,</Text>
              <Text style={styles.name}>{studentName}</Text>
            </View>
            <Avatar.Icon size={48} icon="account" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          </View>

          {/* Quick Stats Card in Header */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{stats.percentage}%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{stats.present}/{stats.total}</Text>
              <Text style={styles.statLabel}>Classes Attended</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("ViewAttendance")}
          >
            <Card style={styles.actionCard}>
              <Card.Content style={styles.cardRow}>
                <Avatar.Icon size={50} icon="calendar-check" style={{ backgroundColor: '#e3f2fd' }} color="#2196f3" />
                <View style={styles.cardTextContainer}>
                  <Text style={styles.cardTitle}>View Attendance</Text>
                  <Text style={styles.cardSubtitle}>Check your detailed daily logs</Text>
                </View>
                <Avatar.Icon size={24} icon="chevron-right" style={{ backgroundColor: 'transparent' }} color="#ccc" />
              </Card.Content>
            </Card>
          </TouchableOpacity>

          <Button
            mode="outlined"
            onPress={logout}
            style={styles.logoutBtn}
            textColor="#d32f2f"
            icon="logout"
          >
            Logout
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8f9fa', paddingTop: Platform.OS === 'android' ? 25 : 0 },
  scroll: { flexGrow: 1 },
  header: {
    padding: 24,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  welcome: { color: 'rgba(255,255,255,0.8)', fontSize: 16 },
  name: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  statItem: { alignItems: 'center' },
  statVal: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)' },
  content: { padding: 20, marginTop: -20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  actionCard: { marginBottom: 15, backgroundColor: '#fff', elevation: 2, borderRadius: 16 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardTextContainer: { flex: 1, marginLeft: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  logoutBtn: { marginTop: 20, borderColor: '#ffcdd2', borderWidth: 1 }
});
