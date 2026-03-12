import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { DEPARTMENTS, YEARS, SECTIONS } from '../constants';

export default function FilterBar({ filters, setFilters }) {
  const renderRadioRow = (label, list, key) => (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ fontWeight: '600', marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {list.map((v) => (
          <TouchableOpacity key={v} onPress={() => setFilters({ ...filters, [key]: v })}
            style={{ paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderRadius: 999, backgroundColor: filters[key] === v ? '#111827' : 'transparent' }}>
            <Text style={{ color: filters[key] === v ? '#fff' : '#111' }}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ marginVertical: 8 }}>
      {renderRadioRow('Department', DEPARTMENTS, 'dept')}
      {renderRadioRow('Year', YEARS, 'year')}
      {renderRadioRow('Section', SECTIONS, 'section')}
    </View>
  );
}
