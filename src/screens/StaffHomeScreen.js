import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useContext } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { AuthContext } from "../context/AuthContext";

export default function StaffHomeScreen({ navigation }) {
  const { logout, user, role } = useContext(AuthContext);

  const menuItems = [
    {
      title: "Dashboard",
      icon: "view-dashboard",
      screen: "Dashboard",
      color: "#4CAF50",
    },
    {
      title: "Mark Attendance",
      icon: "calendar-check",
      screen: "MarkAttendance",
      color: "#2196F3",
    },
    {
      title: "Add Student",
      icon: "account-plus",
      screen: "AddStudent",
      color: "#FF9800",
    },
    {
      title: "Export Data",
      icon: "file-excel",
      screen: "ExportData",
      color: "#9C27B0",
    },
  ];

  // HOD Extra Items
  if (role === 'hod') {
    menuItems.push({
      title: "Audit Logs",
      icon: "history",
      screen: "AuditLogs",
      color: "#607D8B",
    });
    menuItems.push({
      title: "Add Staff",
      icon: "account-tie",
      screen: "AddStaff",
      color: "#E91E63",
    });
  }

  const renderCard = (item, index) => (
    <TouchableOpacity
      key={index}
      style={styles.card}
      onPress={() => navigation.navigate(item.screen)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <MaterialCommunityIcons name={item.icon} size={32} color={item.color} />
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" style={styles.arrow} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <LinearGradient
        colors={['#1565C0', '#0D47A1']}
        style={styles.header}
      >
        <SafeAreaView style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{user?.name || user?.email?.split('@')[0] || 'Staff'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{role ? role.toUpperCase() : 'STAFF'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <MaterialCommunityIcons name="logout" size={24} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>

      {/* BODY */}
      <View style={styles.body}>
        <View style={styles.curve} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.grid}>
            {menuItems.map(renderCard)}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    color: '#BBDEFB',
    fontSize: 14,
    fontWeight: '500',
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 12,
  },
  body: {
    flex: 1,
    marginTop: -20,
  },
  curve: {
    // visual trick if needed, or just rely on negative margin
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#37474F',
    marginBottom: 15,
    marginLeft: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#37474F',
    textAlign: 'center',
  },
  arrow: {
    position: 'absolute',
    right: 10,
    top: 10,
    opacity: 0, // Hidden for cleaner grid look, or 0.5
  },
});
