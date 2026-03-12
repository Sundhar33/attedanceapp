import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { createContext, useEffect, useState } from 'react';
import { auth, db } from '../../firebaseConfig';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [linkedStudentId, setLinkedStudentId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        // 🔥 FIREBASE USER (Staff/Admin)
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userRef);

          if (snap.exists()) {
            const data = snap.data();
            const resolvedRole = (data.role || 'student').toLowerCase();

            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...data,
            });
            setRole(resolvedRole);
            setLinkedStudentId(data.linkedStudentId || null);

            // Clear any student session to avoid conflicts
            await AsyncStorage.removeItem('student_session');
          } else {
            // Fallback
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'student' });
            setRole('student');
          }
        } catch (error) {
          console.error('❌ Error fetching user profile:', error);
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'student' });
          setRole('student');
        } finally {
          setLoading(false);
        }
      } else {
        // 🕵️ CHECK FOR LOCAL STUDENT SESSION
        try {
          const localSession = await AsyncStorage.getItem('student_session');
          if (localSession) {
            const studentData = JSON.parse(localSession);
            setUser(studentData);
            setRole('student');
            setLinkedStudentId(studentData.linkedStudentId);
          } else {
            setUser(null);
            setRole(null);
            setLinkedStudentId(null);
          }
        } catch (e) {
          console.error("Error reading local session", e);
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsub();
  }, []);

  /* ---------- AUTH ACTIONS ---------- */

  // Staff Login (Firebase)
  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  // Student Login (Custom)
  const loginAsStudent = async (email, regNo) => {
    setLoading(true);
    try {
      // 1. Query Students Collection
      // Assuming 'email' or 'regNo' is unique. Searching by both for security.
      const studentsRef = collection(db, 'students');

      // We look for a document where regNo matches AND email matches
      // Note: Make sure your Firestore indexes allow this if compound query
      // For now, let's query by RegNo (primary) and verify email client-side or dual query
      const q = query(studentsRef, where('regNo', '==', regNo));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        throw new Error('Student not found with this Register Number.');
      }

      let studentDoc = null;
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.email && data.email.toLowerCase() === email.toLowerCase()) {
          studentDoc = { id: doc.id, ...data };
        }
        // Fallback: if student data doesn't have email field, maybe allow? 
        // User asked "student auth from email id and regno".
        // Let's strictly check.
      });

      if (!studentDoc) {
        // Try checking if email was correct but regno was wrong (implied by snapshot.empty, but here we found regno)
        throw new Error('Email does not match our records for this Register Number.');
      }

      // 2. Create Session Object
      const sessionUser = {
        uid: studentDoc.id, // Use Firestore Doc ID as generic UID
        email: studentDoc.email,
        name: studentDoc.name,
        role: 'student',
        linkedStudentId: studentDoc.id, // Important for student view
        ...studentDoc
      };

      // 3. Persist Session
      await AsyncStorage.setItem('student_session', JSON.stringify(sessionUser));

      // 4. Update State
      setUser(sessionUser);
      setRole('student');
      setLinkedStudentId(studentDoc.id);

    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth); // Sign out from Firebase (if staff)
      await AsyncStorage.removeItem('student_session'); // Clear local session
      setUser(null);
      setRole(null);
      setLinkedStudentId(null);
    } catch (e) {
      console.error("Logout Error", e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        linkedStudentId,
        loading,
        login,
        loginAsStudent,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};