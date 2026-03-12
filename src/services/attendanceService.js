import { format } from 'date-fns';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { logAction } from './auditService';
import {
  ensureDailyDashboardDoc,
  updateDailyDashboardCounts,
} from './dashboardService';


/* ================= DATE KEY ================= */

export const dateKey = (date) => format(date, 'yyyy-MM-dd');

/* ================= SAVE ATTENDANCE ================= */

export const saveAttendanceBulk = async ({
  date,
  period,
  dept,
  year,
  section,
  entries,
  createdBy,
  user,
  remarks,
}) => {
  if (!dept || !year || !section || !period) {
    throw new Error('Missing class details');
  }

  const role = (user?.role || '').toLowerCase();
  const isHOD = role === 'hod';

  const day = dateKey(date);
  const safeYear = String(year);
  const safePeriod = String(period);

  /* -------- WRITE BATCH -------- */
  const batch = writeBatch(db);

  entries.forEach(e => {
    // New Schema: One document per student per day
    const docId = `${e.studentId}_${day}`;
    const ref = doc(db, 'attendance', docId);

    // We use set with merge: true to update specific period without overwriting others
    batch.set(ref, {
      studentId: e.studentId,
      regNo: e.regNo || '',
      name: e.name || '',
      dept,
      year: safeYear,
      section,
      date: day,
      // Metadata (last updated info)
      updatedAt: Date.now(),
      lastUpdatedBy: createdBy || user?.email || 'system',
      // Nested map for periods
      periods: {
        [safePeriod]: {
          status: e.status || 'present',
          remarks: remarks || '',
          markedBy: createdBy || user?.email || 'system',
          timestamp: Date.now()
        }
      }
    }, { merge: true });
  });

  await batch.commit();

  /* -------- DASHBOARD UPDATE (NEW) -------- */

  const present = entries.filter(e => e.status === 'present').length;
  const absent = entries.filter(e => e.status === 'absent').length;
  const late = entries.filter(e => e.status === 'late').length;
  const od = entries.filter(e => e.status === 'od').length;

  const totalStudents = entries.length;

  await ensureDailyDashboardDoc(day);
  await updateDailyDashboardCounts(
    day,
    dept,
    safeYear,
    section,
    safePeriod,
    totalStudents,
    present,
    absent,
    late,
    od
  );



  /* -------- AUDIT LOG -------- */
  await logAction({
    type: 'attendance',
    action: 'attendance_marked',
    attendanceDate: day,
    dept,
    year: safeYear,
    section,
    period: safePeriod,
    user,
    details: `Attendance marked for ${entries.length} students (One-Doc-Per-Day)`,
    extra: {
      studentsCount: entries.length,
      presentCount: present,
      absentCount: absent,
    },
  });
};

/* ================= FETCH FOR EXPORT ================= */
export const fetchAttendanceByFilters = async ({ from, to, dept, year, section }) => {
  let q = collection(db, 'attendance');
  const constraints = [];

  if (dept) constraints.push(where('dept', '==', dept));
  if (year) constraints.push(where('year', '==', String(year)));
  if (section) constraints.push(where('section', '==', section));

  if (from) constraints.push(where('date', '>=', from));
  if (to) constraints.push(where('date', '<=', to));

  if (constraints.length > 0) {
    q = query(q, ...constraints);
  }

  const snapshot = await getDocs(q);

  // Flatten the One-Doc-Per-Day structure into one row per period for CSV compatibility
  const flattenedRows = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    const { periods } = data;

    if (periods) {
      Object.keys(periods).forEach(pKey => {
        flattenedRows.push({
          id: `${doc.id}_${pKey}`, // unique id for list
          ...data,
          period: pKey,
          status: periods[pKey].status,
          remarks: periods[pKey].remarks,
          markedBy: periods[pKey].markedBy
        });
      });
    } else if (data.status) {
      // Backward compatibility for old "One-Doc-Per-Period" records
      flattenedRows.push({ id: doc.id, ...data });
    }
  });

  return flattenedRows;
};
