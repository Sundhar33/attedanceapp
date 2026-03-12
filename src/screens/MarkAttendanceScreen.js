// MarkAttendanceScreen.js
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import BackgroundLayout from "../components/BackgroundLayout";
import HybridDropdown from '../components/HybridDropdown';
import StudentItem from '../components/StudentItem';
import { PERIODS } from '../constants';
import { AuthContext } from '../context/AuthContext';
import { saveAttendanceBulk } from '../services/attendanceService';
import {
  deleteStudent,
  fetchDistinctFilters,
  fetchSections,
  listStudents,
} from '../services/studentService';
import { isPeriodAllowedNow } from '../utils/periodTimeCheck';

const BOTTOM_BAR_HEIGHT = 100;

export default function MarkAttendanceScreen() {
  const { user, role, loading } = useContext(AuthContext);

  const [departments, setDepartments] = useState([]);
  const [years, setYears] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);

  const [filters, setFilters] = useState({
    dept: '',
    year: '',
    section: '',
    period: '',
  });

  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  /* ---------- DATE PICKER (ADDED ONLY) ---------- */

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const formatDate = (d) => d.toLocaleDateString('en-GB');

  const onDateChange = (_, date) => {
    setShowPicker(false);
    if (date) setSelectedDate(date);
  };

  /* ---------- CACHE ---------- */
  const studentsCache = useRef({});
  const isHOD = (role || '').toLowerCase() === 'hod';

  /* ---------- FILTER SETTERS ---------- */

  const setDept = (v) => {
    setFilters({ dept: v, year: '', section: '', period: '' });
    setStudents([]);
    setMarks({});
  };

  const setYear = (v) => {
    setFilters(prev => ({ ...prev, year: v, section: '', period: '' }));
    setStudents([]);
    setMarks({});
  };

  const setSection = (v) => {
    setFilters(prev => ({ ...prev, section: v }));
  };

  const setPeriod = (v) => {
    setFilters(prev => ({ ...prev, period: v }));
  };

  /* ---------- LOAD FILTER OPTIONS ---------- */

  useEffect(() => {
    if (!loading) {
      fetchDistinctFilters().then(({ departments, years }) => {
        setDepartments(departments || []);
        setYears(years || []);
      });
    }
  }, [loading]);

  useEffect(() => {
    if (filters.dept && filters.year) {
      fetchSections(filters.dept, filters.year).then(setSectionsList);
    } else {
      setSectionsList([]);
    }
  }, [filters.dept, filters.year]);

  /* ---------- LOAD STUDENTS (CACHED) ---------- */

  const loadStudents = useCallback(async () => {
    const dept = filters.dept.trim();
    const year = filters.year.trim();
    const section = filters.section.trim();

    if (!dept || !year || !section) return;

    const key = `${dept}_${year}_${section}`;

    if (studentsCache.current[key]) {
      setStudents(studentsCache.current[key]);
      return;
    }

    const list = await listStudents({ dept, year, section });

    list.sort((a, b) => {
      const ra = a.regNo ?? '';
      const rb = b.regNo ?? '';
      return ra.localeCompare(rb, undefined, { numeric: true });
    });

    const baseMarks = {};
    list.forEach(s => (baseMarks[s.id] = 'present'));

    studentsCache.current[key] = list;
    setMarks(baseMarks);
    setStudents(list);

    setInfoMessage(list.length === 0 ? 'No students found' : '');
  }, [filters]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  /* ---------- BULK SET ---------- */

  const bulkSet = (status) => {
    const updated = {};
    students.forEach(s => (updated[s.id] = status));
    setMarks(updated);
  };

  const chooseBulkStatus = () => {
    Alert.alert(
      'Set Attendance',
      'Choose status for all students',
      [
        { text: 'Present', onPress: () => bulkSet('present') },
        { text: 'Absent', onPress: () => bulkSet('absent') },
        { text: 'Late', onPress: () => bulkSet('late') },
        { text: 'OD', onPress: () => bulkSet('od') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  /* ---------- DELETE STUDENT ---------- */
  const handleDeleteStudent = (student) => {
    Alert.alert(
      'Delete Student',
      `Are you sure you want to delete ${student.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudent(student.id);
              // Update local state
              setStudents(prev => prev.filter(s => s.id !== student.id));
              // Update cache if necessary (optional, but good for consistency)
              const key = `${filters.dept.trim()}_${filters.year.trim()}_${filters.section.trim()}`;
              if (studentsCache.current[key]) {
                studentsCache.current[key] = studentsCache.current[key].filter(s => s.id !== student.id);
              }
              Alert.alert('Success', 'Student deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete student: ' + error.message);
            }
          },
        },
      ]
    );
  };

  /* ---------- SAVE ---------- */

  const onSave = async () => {
    if (!filters.period) {
      Alert.alert('Period Required');
      return;
    }

    if (!isHOD && !isPeriodAllowedNow(filters.period)) {
      Alert.alert('Time Restricted');
      return;
    }

    try {
      setSaving(true);

      await saveAttendanceBulk({
        date: selectedDate, // ✅ using picked date
        period: String(filters.period),
        dept: filters.dept,
        year: filters.year,
        section: filters.section,
        entries: students.map(s => ({
          studentId: s.id,
          regNo: s.regNo || '',
          name: s.name || '',
          dept: filters.dept,
          year: filters.year,
          section: filters.section,
          status: marks[s.id] || 'present',
        })),
        createdBy: user.email,
        user,
        remarks,
      });

      Alert.alert('Success', 'Attendance saved successfully');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  /* ---------- COUNTS ---------- */

  const counts = {
    total: students.length,
    present: 0,
    absent: 0,
    late: 0,
    od: 0,
  };

  students.forEach(s => {
    const st = marks[s.id] || 'present';
    if (counts[st] !== undefined) counts[st]++;
  });

  /* ---------- RENDER ---------- */

  return (
    <BackgroundLayout>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1 }}>
          {infoMessage ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>{infoMessage}</Text>
            </View>
          ) : null}

          <FlatList
            data={students}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingBottom: BOTTOM_BAR_HEIGHT }}
            renderItem={({ item }) => (
              <StudentItem
                student={item}
                value={marks[item.id] || 'present'}
                onChange={v =>
                  setMarks(prev => ({ ...prev, [item.id]: v }))
                }
                onDelete={handleDeleteStudent}
              />
            )}
            ListHeaderComponent={
              <View style={styles.header}>
                {/* ✅ DATE PICKER ADDED ON TOP */}
                <TouchableOpacity
                  style={styles.dateBox}
                  onPress={() => setShowPicker(true)}
                >
                  <Text style={styles.dateText}>
                    Date: {formatDate(selectedDate)}
                  </Text>
                </TouchableOpacity>

                {showPicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                  />
                )}

                <HybridDropdown label="Department" value={filters.dept}
                  options={departments} onChangeText={setDept} />
                <HybridDropdown label="Year" value={filters.year}
                  options={years} onChangeText={setYear} />
                <HybridDropdown label="Section" value={filters.section}
                  options={sectionsList} onChangeText={setSection} />
                <HybridDropdown label="Period" value={filters.period}
                  options={PERIODS.map(p => p.id.toString())}
                  onChangeText={setPeriod} />

                <TextInput
                  label="Remarks"
                  value={remarks}
                  onChangeText={setRemarks}
                />

                <Button
                  mode="outlined"
                  style={{ marginTop: 12 }}
                  onPress={chooseBulkStatus}
                  disabled={students.length === 0}
                >
                  Set Status for All
                </Button>
              </View>
            }
          />

          <View style={styles.bottomBar}>
            <View style={styles.countRow}>
              <Text>Total: {counts.total}</Text>
              <Text style={{ color: 'green' }}>P: {counts.present}</Text>
              <Text style={{ color: 'red' }}>A: {counts.absent}</Text>
              <Text style={{ color: 'orange' }}>L: {counts.late}</Text>
              <Text style={{ color: 'blue' }}>OD: {counts.od}</Text>
            </View>

            <Button
              mode="contained"
              onPress={onSave}
              loading={saving}
              disabled={saving || counts.total === 0}
            >
              Save Attendance
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </BackgroundLayout>
  );
}

const styles = StyleSheet.create({
  header: { padding: 12 },

  dateBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 16,
  },

  infoBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    margin: 12,
    borderRadius: 8,
  },
  infoText: {
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '600',
  },
  bottomBar: {
    height: BOTTOM_BAR_HEIGHT,
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
});
