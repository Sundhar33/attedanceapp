import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/* ================= CSV GENERATOR ================= */

export const toCSV = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return '';

  const map = {};

  rows.forEach(r => {
    const key = `${r.studentId}_${r.date}`;

    if (!map[key]) {
      map[key] = {
        meta: {
          regNo: r.regNo,
          name: r.name,
          dept: r.dept,
          year: r.year,
          section: r.section,
          date: r.date,
        },
        periods: {},
      };
    }

    map[key].periods[r.period] = r.status;
  });

  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  const headers = [
    'RegNo','Name','Dept','Year','Section','Date',
    'P1','P2','P3','P4','P5','P6','P7','P8',
    'Percentage' // ✅ NEW
  ];

  const lines = [headers.join(',')];

  const records = Object.values(map).sort((a, b) => {
    const d = a.meta.date.localeCompare(b.meta.date);
    if (d !== 0) return d;
    return String(a.meta.regNo || '').localeCompare(
      String(b.meta.regNo || ''),
      undefined,
      { numeric: true }
    );
  });

  for (const r of records) {
    let presentCount = 0;
    let totalCount = 0;

    const periodValues = [1,2,3,4,5,6,7,8].map(p => {
      const s = r.periods[p];

      if (s) totalCount++;

      if (s === 'present') {
        presentCount++;
        return 'P';
      }
      if (s === 'od') {
        presentCount++;
        return 'OD';
      }
      if (s === 'absent') return 'A';
      if (s === 'late') return 'L';
      return '-';
    });

    const percentage =
      totalCount > 0
        ? Math.round((presentCount / totalCount) * 100)
        : 0;

    const row = [
      r.meta.regNo,
      r.meta.name,
      r.meta.dept,
      r.meta.year,
      r.meta.section,
      r.meta.date,
      ...periodValues,
      `${percentage}%` // ✅ LAST COLUMN
    ];

    lines.push(row.map(esc).join(','));
  }

  return lines.join('\n');
};

/* ================= EXPORT & SHARE ================= */

export const exportAttendanceCSV = async (rows) => {
  try {
    const csv = toCSV(rows);
    if (!csv) {
      alert('No data to export');
      return;
    }

    const fileUri =
      FileSystem.documentDirectory + `attendance_${Date.now()}.csv`;

    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    await Sharing.shareAsync(fileUri);
  } catch (err) {
    console.error('CSV export error', err);
    alert('Export failed');
  }
};
