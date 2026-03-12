import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export const addStudent = (payload) => addDoc(collection(db, 'students'), payload);

export const listStudents = async (filters) => {
  const { dept, year, section } = filters || {};
  let q = collection(db, 'students');
  const clauses = [];
  if (dept) clauses.push(where('dept', '==', dept));
  if (year) clauses.push(where('year', '==', year));
  if (section) clauses.push(where('section', '==', section));
  if (clauses.length) q = query(collection(db, 'students'), ...clauses);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const deleteStudent = async (id) => {
  await deleteDoc(doc(db, 'students', id));
  try {
    await deleteDoc(doc(db, 'users', id));
  } catch (e) {
    console.log('User doc delete optional/failed', e);
  }
};

export const fetchSections = async (dept, year) => {
  if (!dept || !year) return [];

  const q = query(
    collection(db, 'students'),
    where('dept', '==', dept),
    where('year', '==', year)
  );

  const snapshot = await getDocs(q);
  const sections = new Set();
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.section) sections.add(data.section);
  });

  // Return sorted sections
  return Array.from(sections).sort();
};

export const fetchDistinctFilters = async () => {
  const snap = await getDocs(collection(db, 'students'));
  const depts = new Set();
  const years = new Set();

  snap.forEach(doc => {
    const d = doc.data();
    if (d.dept) depts.add(d.dept.trim());
    if (d.year) years.add(d.year.trim());
  });

  return {
    departments: Array.from(depts).sort(),
    years: Array.from(years).sort()
  };
};
