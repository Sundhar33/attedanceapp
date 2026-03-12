import { LinearGradient } from 'expo-linear-gradient';
import { useContext, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen() {
  const { login, loginAsStudent } = useContext(AuthContext);

  const [isStudent, setIsStudent] = useState(false); // Toggle between Staff and Student
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regNo, setRegNo] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    try {
      setLoading(true);

      if (isStudent) {
        // STUDENT LOGIN
        if (!email || !regNo) {
          Alert.alert('Missing details', 'Please enter Email and Register Number');
          return;
        }
        await loginAsStudent(email.trim(), regNo.trim().toUpperCase());
      } else {
        // STAFF LOGIN
        if (!email || !password) {
          Alert.alert('Missing details', 'Please enter Email and Password');
          return;
        }
        await login(email.trim(), password);
      }
    } catch (e) {
      Alert.alert('Login failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0A3D91', '#1565C0', '#1E88E5']}
      style={styles.container}
    >
      <View style={styles.card}>

        {/* APP NAME */}
        <Text style={styles.appName}>DSEC Attendance</Text>
        <Text style={styles.tagline}>
          Digital Student Entry & Attendance System
        </Text>

        {/* TABS */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, !isStudent && styles.activeTab]}
            onPress={() => setIsStudent(false)}
          >
            <Text style={[styles.tabText, !isStudent && styles.activeTabText]}>
              Staff Login
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, isStudent && styles.activeTab]}
            onPress={() => setIsStudent(true)}
          >
            <Text style={[styles.tabText, isStudent && styles.activeTabText]}>
              Student Login
            </Text>
          </TouchableOpacity>
        </View>

        {/* INPUTS */}
        <TextInput
          label="Email Address"
          mode="outlined"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          left={<TextInput.Icon icon="email-outline" />}
          theme={{ colors: { primary: '#1565C0' } }}
        />

        {isStudent ? (
          /* STUDENT INPUTS */
          <TextInput
            label="Register Number"
            mode="outlined"
            autoCapitalize="characters"
            value={regNo}
            onChangeText={setRegNo}
            style={styles.input}
            left={<TextInput.Icon icon="card-account-details-outline" />}
            theme={{ colors: { primary: '#1565C0' } }}
          />
        ) : (
          /* STAFF INPUTS */
          <TextInput
            label="Password"
            mode="outlined"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            left={<TextInput.Icon icon="lock-outline" />}
            theme={{ colors: { primary: '#1565C0' } }}
          />
        )}

        {/* FORGOT PASSWORD (STAFF ONLY) */}
        {!isStudent && (
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Reset Password',
                'A password reset link will be sent to your registered email.'
              )
            }
            style={styles.forgotLink}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        )}

        {/* LOGIN BUTTON */}
        <Button
          mode="contained"
          onPress={onSubmit}
          loading={loading}
          disabled={loading}
          contentStyle={{ paddingVertical: 10 }}
          style={[styles.button, isStudent && { marginTop: 20 }]}
        >
          {isStudent ? 'Find My Details' : 'Login'}
        </Button>

        {/* FOOTER */}
        <Text style={styles.footer}>
          © {new Date().getFullYear()} DSEC • All rights reserved
        </Text>

      </View>
    </LinearGradient>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 30,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },

  appName: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#0A3D91',
    marginBottom: 6,
    letterSpacing: 0.5,
  },

  tagline: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 24,
  },

  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },

  activeTab: {
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }
  },

  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  activeTabText: {
    color: '#1565C0',
    fontWeight: '700',
  },

  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },

  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 26,
  },

  forgotText: {
    color: '#1565C0',
    fontWeight: '600',
  },

  button: {
    borderRadius: 12,
    backgroundColor: '#1565C0',
  },

  footer: {
    marginTop: 28,
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
