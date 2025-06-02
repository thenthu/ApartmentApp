import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SubMenu = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.option, styles.resident]} onPress={() => navigation.navigate("Residents")}>
        <Ionicons name="people" size={36} color="#fff" />
        <Text style={styles.optionText}>Cư dân</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.option, styles.guest]} onPress={() => navigation.navigate("Guests")}>
        <Ionicons name="person-circle" size={36} color="#fff" />
        <Text style={styles.optionText}>Khách</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#f2f2f2',
  },
  option: {
    height: 150,
    borderRadius: 12,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  resident: {
    backgroundColor: '#4a90e2',
  },
  guest: {
    backgroundColor: '#50e3c2',
  },
  optionText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
});

export default SubMenu;
