import { db } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Generic audit logger
 * Can be used for:
 * - create / update / delete
 * - attendance
 * - login / logout
 */
export const logAction = async ({
  type = 'system',          // 'attendance', 'student', 'auth'
  action,                   // 'create', 'update', 'delete', 'attendance_marked'
  targetCollection = '',
  targetId = '',
  oldValue = null,
  newValue = null,

  // context (optional)
  dept = '',
  year = '',
  section = '',
  period = '',
  attendanceDate = '',

  user,                     // { uid, email, role }
  details = '',
  extra = {}
}) => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      type,
      action,

      targetCollection,
      targetId,

      oldValue,
      newValue,

      // 🔹 attendance context
      dept,
      year,
      section,
      period,
      attendanceDate,

      performedBy: user?.email || 'system',
      performedByUid: user?.uid || '',
      role: user?.role || 'unknown',

      details,
      extra,

      timestamp: serverTimestamp(),
      platform: 'web'
    });

    console.log(
      `[Audit] ${type}:${action} by ${user?.email || 'system'}`
    );
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // ❗ Never block main flow
  }
};
