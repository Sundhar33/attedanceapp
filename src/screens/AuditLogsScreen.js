import { format } from 'date-fns';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text
} from 'react-native';
import { ActivityIndicator, Card } from 'react-native-paper';
import { db } from '../../firebaseConfig';
import BackgroundLayout from '../components/BackgroundLayout';

export default function AuditLogsScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'audit_logs'),
        // where('type', '==', 'attendance'), // Removed to avoid index requirement
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const snap = await getDocs(q);
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(log => log.type === 'attendance'); // Client-side filter

      setLogs(data);
    } catch (err) {
      console.error('Audit log fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>

        <Text style={styles.title}>
          Attendance Marked
        </Text>

        <Text style={styles.detail}>
          Date: {item.attendanceDate}
        </Text>

        <Text style={styles.detail}>
          Period: {item.period}
        </Text>

        <Text style={styles.detail}>
          Class: {item.dept} {item.year} {item.section}
        </Text>

        <Text style={styles.detail}>
          Students: {item.extra?.studentsCount ?? item.studentsCount ?? '-'}
        </Text>

        <Text style={styles.detail}>
          Present: {item.extra?.presentCount ?? '-'}
        </Text>
        <Text style={styles.detail}>
          Absent: {item.extra?.absentCount ?? '-'}
        </Text>

        <Text style={styles.meta}>
          By: {item.performedBy}
        </Text>

        <Text style={styles.time}>
          {item.timestamp
            ? format(item.timestamp.toDate(), 'HH:mm:ss')
            : ''}
        </Text>

      </Card.Content>
    </Card >
  );

  return (
    <BackgroundLayout style={styles.container}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No attendance audit logs found
            </Text>
          }
        />
      )}
    </BackgroundLayout>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginBottom: 12
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6
  },
  detail: {
    fontSize: 14,
    color: '#555'
  },
  meta: {
    marginTop: 6,
    fontSize: 13,
    color: '#333'
  },
  time: {
    fontSize: 12,
    color: '#888',
    marginTop: 2
  },
  empty: {
    textAlign: 'center',
    marginTop: 30,
    color: '#666'
  }
});
