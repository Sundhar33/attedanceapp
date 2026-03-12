import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp,
  } from "firebase/firestore";
  import { db } from "../../firebaseConfig";
  
  /* ================= ENSURE DAILY DOC ================= */
  
  export const ensureDailyDashboardDoc = async (dateKey) => {
    const ref = doc(db, "daily_dashboard", dateKey);
    const snap = await getDoc(ref);
  
    if (!snap.exists()) {
      await setDoc(ref, {
        createdAt: serverTimestamp(),
      });
    }
  };
  
  /* ================= UPDATE COUNTS ================= */
  /*
  Path:
  daily_dashboard/{date}/{dept}/{year}/{section}/{period}
  */
  
  export const updateDailyDashboardCounts = async (
    dateKey,
    dept,
    year,
    section,
    period,
    total,
    present,
    absent,
    late,
    od
  ) => {
    const ref = doc(db, "daily_dashboard", dateKey);
  
    await updateDoc(ref, {
      [`${dept}.${year}.${section}.${period}`]: {
        total,
        present,
        absent,
        late,
        od,
      },
    });
  };
  