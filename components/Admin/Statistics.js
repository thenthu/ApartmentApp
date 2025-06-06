import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { authApis, endpoints } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';


const Statistics = () => {
  const [loading, setLoading] = useState(true);
  const [apartments, setApartments] = useState([]);
  const [occupiedCount, setOccupiedCount] = useState(0);
  const [unoccupiedCount, setUnoccupiedCount] = useState(0);
  const [totalResidents, setTotalResidents] = useState(0);
  const [showOccupied, setShowOccupied] = useState(false);
  const [showUnoccupied, setShowUnoccupied] = useState(false);
  const [selectedApartments, setSelectedApartments] = useState([]);
  const [residents, setResidents] = useState([]);
  const [showResidents, setShowResidents] = useState(false);

  const loadApartments = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      let allApartments = [];
      let nextUrl = endpoints.apartments;

      while (nextUrl) {
        const res = await authApis(token).get(nextUrl);
        allApartments = allApartments.concat(res.data.results);
        nextUrl = res.data.next;
      }

      let occupied = 0;
      let unoccupied = 0;

      allApartments.forEach((apt) => {
        if (apt.household_head) {
          occupied++;
        } else {
          unoccupied++;
        }
      });

      setOccupiedCount(occupied);
      setUnoccupiedCount(unoccupied);
      setApartments(allApartments);
    } catch (err) {
      console.error('Lỗi khi tải danh sách căn hộ:', err);
    }
  };

  const loadResidents = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    const res = await authApis(token).get(endpoints.residents);

    const sortedResidents = res.data.sort((a, b) => {
        const nameA = a.name.trim().split(' ');
        const nameB = b.name.trim().split(' ');

        const firstNameA = nameA.pop().toLowerCase();
        const middleNameA = nameA.join(' ').toLowerCase();

        const firstNameB = nameB.pop().toLowerCase();
        const middleNameB = nameB.join(' ').toLowerCase();

        if (firstNameA < firstNameB) return -1;
        if (firstNameA > firstNameB) return 1;

        if (middleNameA < middleNameB) return -1;
        if (middleNameA > middleNameB) return 1;

        if (middleNameA < middleNameB) return -1;
        if (middleNameA > middleNameB) return 1;

        return 0;
    });

    setResidents(sortedResidents);
    setTotalResidents(res.data.length);
    } catch (err) {
    console.error('Lỗi khi tải danh sách dân cư:', err);
    }
  };



  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([loadApartments(), loadResidents()]);
      setLoading(false);
    };
    fetchData();
  }, []);


  const renderApartmentItem = ({ item }) => {
    const resident = residents.find((res) => res.id === item.household_head);
    const residentName = resident ? resident.name : 'Chưa có';

    return (
      <View style={styles.card}>
        <Text style={styles.cardText}>{item.number}</Text>
        <Text style={styles.cardText}>{residentName}</Text>
      </View>
    );
  };

  const renderResidentItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardText}>{item.name}</Text>
    </View>
  );

  const handleShowApartments = (type) => {
    if (type === 'occupied') {
      if (showOccupied) {
        setShowOccupied(false);
      } else {
        const filteredApartments = apartments.filter((apt) => apt.household_head);
        setSelectedApartments(filteredApartments);
        setShowOccupied(true);
        setShowUnoccupied(false);
      }
    } else if (type === 'unoccupied') {
      if (showUnoccupied) {
        setShowUnoccupied(false);
      } else {
        const filteredApartments = apartments.filter((apt) => !apt.household_head);
        setSelectedApartments(filteredApartments);
        setShowUnoccupied(true);
        setShowOccupied(false);
      }
    }
  };

  const handleShowResidents = () => {
    setShowResidents(!showResidents);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#4a90e2" />
      ) : (
        <>
          <Text style={styles.statText}>Tổng số căn hộ: {apartments.length}</Text>
          <Text style={styles.statText}>Căn hộ đã có người ở: {occupiedCount}</Text>
          <Text style={styles.statText}>Căn hộ chưa có người ở: {unoccupiedCount}</Text>
          <Text style={styles.statText}>Tổng số dân cư: {totalResidents}</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => handleShowApartments('occupied')}
          >
            <Text style={styles.buttonText}>Xem căn hộ đã có người ở</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => handleShowApartments('unoccupied')}
          >
            <Text style={styles.buttonText}>Xem căn hộ chưa có người ở</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleShowResidents}
          >
            <Text style={styles.buttonText}>Xem cư dân</Text>
          </TouchableOpacity>

          {showOccupied && (
            <FlatList
              data={selectedApartments}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderApartmentItem}
              contentContainerStyle={styles.flatListContainer}
            />
          )}
          {showUnoccupied && (
            <FlatList
              data={selectedApartments}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderApartmentItem}
              contentContainerStyle={styles.flatListContainer}
            />
          )}

          {showResidents && (
            <FlatList
              data={residents}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderResidentItem}
              contentContainerStyle={styles.flatListContainer}
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flex: 1,
  },
  statText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  button: {
    backgroundColor: '#4a90e2',
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0f4ff',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    color: '#333',
  },
  flatListContainer: {
    paddingBottom: 16,
  },
});

export default Statistics;
