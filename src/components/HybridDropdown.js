import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Modal } from 'react-native';
import { TextInput } from 'react-native-paper';

export default function HybridDropdown({ label, value, onChangeText, options = [], placeholder, maxHeight }) {
    const [showOptions, setShowOptions] = useState(false);

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => setShowOptions(true)} activeOpacity={1}>
                <View pointerEvents="none">
                    <TextInput
                        label={label}
                        value={value}
                        placeholder={placeholder}
                        style={styles.input}
                        editable={false} // Disable typing
                        right={
                            <TextInput.Icon
                                icon="chevron-down"
                            />
                        }
                    />
                </View>
            </TouchableOpacity>

            <Modal
                transparent={true}
                visible={showOptions}
                onRequestClose={() => setShowOptions(false)}
                animationType="fade"
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowOptions(false)}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalHeader}>Select {label}</Text>

                        {options.length === 0 ? (
                            <Text style={styles.emptyText}>No options available</Text>
                        ) : (
                            <FlatList
                                data={options}
                                keyExtractor={(item, index) => index.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.option}
                                        onPress={() => {
                                            onChangeText(item);
                                            setShowOptions(false);
                                        }}
                                    >
                                        <Text style={styles.optionText} numberOfLines={1}>{item}</Text>
                                    </TouchableOpacity>
                                )}
                                style={{ maxHeight: maxHeight || 400 }}
                            />
                        )}

                        <TouchableOpacity style={styles.closeBtn} onPress={() => setShowOptions(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
    },
    input: {
        backgroundColor: '#fff',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        elevation: 5,
        maxHeight: '80%',
        width: '100%',
        alignSelf: 'center'
    },
    modalHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
        textAlign: 'center'
    },
    option: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    optionText: {
        fontSize: 16,
        color: '#333',
    },
    emptyText: {
        textAlign: 'center',
        color: '#777',
        marginVertical: 20
    },
    closeBtn: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#eee',
        borderRadius: 8,
        alignItems: 'center'
    },
    closeText: {
        fontWeight: 'bold',
        color: '#333'
    }
});
