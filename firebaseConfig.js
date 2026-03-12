import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// V2 Credentials
const firebaseConfig = {
  apiKey: "AIzaSyAfeVeT8trWW_QcL6lRTvT8GgqhUbmduQE",
  authDomain: "v2attendance.firebaseapp.com",
  projectId: "v2attendance",
  storageBucket: "v2attendance.firebasestorage.app",
  messagingSenderId: "897318596309",
  appId: "1:897318596309:web:824371147cca39c95a3c5c",
  measurementId: "G-HK0NBD5V0W"
};

let app;
let auth;
let db;

try {
  // 1. Initialize App
  // Check if any app exists.
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);

    // Initialize Auth with Persistence if available
    if (typeof getReactNativePersistence === 'function') {
      try {
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } catch (persistenceError) {
        console.warn("Auth persistence init failed, falling back to getAuth", persistenceError);
        auth = getAuth(app);
      }
    } else {
      console.warn("getReactNativePersistence is not a function, falling back to getAuth");
      auth = getAuth(app);
    }

  } else {
    // 2. Reuse Existing App
    app = getApp();

    // Get Existing Auth
    // Use getAuth() safely. If it fails (rare), we catch it.
    auth = getAuth(app);
  }
} catch (error) {
  console.error("🔥 Firebase Initialization Error:", error);
}

// 3. Initialize Firestore
try {
  db = getFirestore(app);
} catch (e) {
  console.error("🔥 Firestore Initialization Error:", e);
}

// 4. Secondary App (Safety Wrapper)
const SECONDARY_APP_NAME = "SECONDARY";
let secondaryAuth;

try {
  const existingSecondary = getApps().find(a => a.name === SECONDARY_APP_NAME);
  const secondaryApp = existingSecondary || initializeApp(firebaseConfig, SECONDARY_APP_NAME);
  // Secondary auth usually doesn't need persistence, so getAuth is fine
  secondaryAuth = getAuth(secondaryApp);
} catch (e) {
  console.error("Secondary Auth Error:", e);
}

export { auth, db, secondaryAuth };
