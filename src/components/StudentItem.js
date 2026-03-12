import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { IconButton } from 'react-native-paper';
import { ATTENDANCE_STATUSES } from '../constants';

export default function StudentItem({ student, value, onChange, onDelete }) {
  return (
    <View style={{ borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 4 }}>{student.name}</Text>
        <Text style={{ color: '#666', fontSize: 14 }}>{student.regNo}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
          {ATTENDANCE_STATUSES.map((s) => (
            <TouchableOpacity key={s.key} onPress={() => onChange(s.key)}
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderWidth: 1,
                borderRadius: 999,
                borderColor: value === s.key ? s.color : '#e5e7eb',
                backgroundColor: value === s.key ? s.color : 'transparent'
              }}>
              <Text style={{ color: value === s.key ? '#fff' : '#111' }}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {onDelete && (
        <IconButton
          icon="delete"
          iconColor="#ff4444"
          size={20}
          onPress={() => onDelete(student)}
        />
      )}
    </View>
  );
}
