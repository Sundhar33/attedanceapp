import React, { useContext } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthContext } from "../context/AuthContext";

// Auth
import AddStaffScreen from "../screens/AddStaffScreen";
import LoginScreen from "../screens/LoginScreen";

// Homes
import StaffHomeScreen from "../screens/StaffHomeScreen";
import StudentHomeScreen from "../screens/StudentHomeScreen";

// HOD Screens
import AuditLogsScreen from "../screens/AuditLogsScreen";

// Staff Screens
import DashboardScreen from "../screens/DashboardScreen";
import MarkAttendanceScreen from "../screens/MarkAttendanceScreen";
import AddStudentScreen from "../screens/AddStudentScreen";
import ExportDataScreen from "../screens/ExportDataScreen";

// Student Screen
import ViewAttendanceScreen from "../screens/ViewAttendanceScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, role, loading } = useContext(AuthContext);

  // 🔒 WAIT UNTIL AUTH + ROLE READY
  if (loading) {
    return null; // or SplashScreen
  }

  // 🔐 NOT LOGGED IN
  if (!user) {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    );
  }

  // 🧑‍🏫 HOD
  if (role === "hod") {
    return (
      <Stack.Navigator>
        <Stack.Screen name="StaffHome" component={StaffHomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AuditLogs" component={AuditLogsScreen} />
        <Stack.Screen name="AddStudent" component={AddStudentScreen} />
        <Stack.Screen name="MarkAttendance" component={MarkAttendanceScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="ExportData" component={ExportDataScreen} />
        <Stack.Screen name="AddStaff" component={AddStaffScreen} />

      </Stack.Navigator>
    );
  }

  // 👨‍🏫 STAFF
  if (role === "staff") {
    return (
      <Stack.Navigator>
        <Stack.Screen name="StaffHome" component={StaffHomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="MarkAttendance" component={MarkAttendanceScreen} />
        <Stack.Screen name="AddStudent" component={AddStudentScreen} />
        <Stack.Screen name="ExportData" component={ExportDataScreen} />
      </Stack.Navigator>
    );
  }

  // 🎓 STUDENT
  return (
    <Stack.Navigator>
      <Stack.Screen name="StudentHome" component={StudentHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ViewAttendance" component={ViewAttendanceScreen} />
    </Stack.Navigator>
  );
}
