import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl, TextInput, } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApis, endpoints } from '../../configs/Apis';
import { Ionicons } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';

const Apartments = () => {
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const apartmentsPerPage = 5;

  const [modalVisible, setModalVisible] = useState(false);
  const [editingApartment, setEditingApartment] = useState(null);
  const [number, setNumber] = useState('');
  const [price, setPrice] = useState('');
  const [area, setArea] = useState('');
  const [residentsOptions, setResidentsOptions] = useState([]);
  const [householdHead, setHouseholdHead] = useState(null);
  const [residents, setResidents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [originalApartments, setOriginalApartments] = useState([]);
  const [allApartments, setAllApartments] = useState([]);

  const loadResidents = async (apartmentId, token) => {
    try {
      const res = await authApis(token).get(`${endpoints.apartments}${apartmentId}/residents/`);
      return res.data;
    } catch (err) {
      console.error(`Lỗi khi lấy cư dân phòng ${apartmentId}:`, err);
      return [];
    }
  };

  const loadApartments = async (url = endpoints.apartments) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const res = await authApis(token).get(url);
      const apartmentList = res.data.results;

      const enrichedApartments = await Promise.all(
        apartmentList.map(async (apartment) => {
          const residents = await loadResidents(apartment.id, token);
          const householdHead = residents.find(r => r.id === apartment.household_head);
          return {
            ...apartment,
            residents: residents.filter(r => r.id !== apartment.household_head),
            householdHeadName: householdHead ? householdHead.name : null,
            allResidents: residents,
          };
        })
      );

      setOriginalApartments(enrichedApartments);
      setApartments(enrichedApartments);
      setNextPage(res.data.next);
      setPrevPage(res.data.previous);

      const totalResults = res.data.count;
      setTotalPages(Math.ceil(totalResults / apartmentsPerPage));
    } catch (error) {
      console.error('Lỗi khi tải căn hộ:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllApartmentsOnce = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      let url = endpoints.apartments;
      let all = [];

      while (url) {
        const res = await authApis(token).get(url);
        const apartmentList = res.data.results;

        const enriched = await Promise.all(
          apartmentList.map(async (apartment) => {
            const residents = await loadResidents(apartment.id, token);
            const householdHead = residents.find(r => r.id === apartment.household_head);
            return {
              ...apartment,
              residents: residents.filter(r => r.id !== apartment.household_head),
              householdHeadName: householdHead ? householdHead.name : null,
              allResidents: residents,
            };
          })
        );

        all = [...all, ...enriched];
        url = res.data.next;
      }

      setAllApartments(all);
    } catch (error) {
      console.error('Lỗi khi tải toàn bộ căn hộ:', error);
    }
  };

  const loadAllResidents = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await authApis(token).get(endpoints.residents);
      setResidents(res.data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách cư dân:', error);
    }
  };

  const handleNextPage = () => {
    if (nextPage) {
      loadApartments(nextPage);
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (prevPage) {
      loadApartments(prevPage);
      setCurrentPage(prev => Math.max(1, prev - 1));
    }
  };

  const onRefresh = () => {
    loadApartments();
  };

  useEffect(() => {
    loadApartments();
    loadAllResidents();
    loadAllApartmentsOnce();
  }, []);

  const filterApartments = (apartments, searchText) => {
  if (!searchText.trim()) return apartments;

  return allApartments.filter((apartment) => {
    const apartmentMatches = 
      apartment.number.toString().toLowerCase().includes(searchText.toLowerCase()) ||
      apartment.price.toString().toLowerCase().includes(searchText.toLowerCase()) ||
      apartment.area.toString().toLowerCase().includes(searchText.toLowerCase());

      const residentMatches = apartment.residents.some((resident) =>
      resident.name.toLowerCase().includes(searchText.toLowerCase())
    );

    return apartmentMatches || residentMatches;
  });
};

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  useEffect(() => {
    const filtered = filterApartments(originalApartments, searchQuery);
    setApartments(filtered);
  }, [searchQuery, originalApartments]);

  const handleDeleteApartment = async (id) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await authApis(token).delete(`${endpoints.apartments}${id}/`);
      loadApartments();
    } catch (err) {
      console.error('Lỗi khi xoá căn hộ:', err);
    }
  };

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const isEditing = editingApartment !== null;

      if (isEditing) {
        const formData = new FormData();
        formData.append('number', number);
        formData.append('price', price);
        formData.append('area', area);
        if (householdHead) {
          formData.append('household_head', householdHead);
        } else {
          formData.append('household_head', '');
        }

        await authApis(token).put(
          `${endpoints.apartments}${editingApartment.id}/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      } else {
        const jsonData = {
          number,
          price,
          area,
          household_head: householdHead,
        };

        await authApis(token).post(endpoints.apartments, jsonData, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }

      setModalVisible(false);
      setEditingApartment(null);
      setNumber('');
      setPrice('');
      setArea('');
      setHouseholdHead(null);
      setResidentsOptions([]);
      loadApartments();
    } catch (error) {
      console.error('Lỗi khi lưu căn hộ:', error);
    }
  };

  const openEditModal = (apartment) => {
    setEditingApartment(apartment);
    setNumber(apartment.number.toString());
    setPrice(apartment.price?.toString() || '');
    setArea(apartment.area?.toString() || '');
    setHouseholdHead(apartment.household_head || null);
    setResidentsOptions(apartment.allResidents || []);
    setModalVisible(true);
  };

  const renderApartment = ({ item }) => (
    <Card style={styles.card}>
      <Card.Title
        title={`Phòng ${item.number}`}
        subtitle={item.householdHeadName ? `Chủ hộ: ${item.householdHeadName}` : 'Chủ hộ: Chưa có'}
        titleStyle={styles.cardTitle}
        subtitleStyle={styles.cardSubtitle}
      />
      <Card.Content>
        <Text>Diện tích: {item.area} m²</Text>
        <Text>Giá: {Number(item.price).toLocaleString('vi-VN')} VND</Text>
        {item.residents.length > 0 && (
          <>
            <Text style={styles.residentTitle}>Thành viên trong hộ:</Text>
            <Text style={styles.residentNames}>{item.residents.map(r => r.name).join('\n')}</Text>
          </>
        )}
      </Card.Content>
      <Card.Actions style={styles.buttonGroup}>
        <Button
          icon="pencil"
          mode="contained"
          style={styles.editButton}
          onPress={() => openEditModal(item)}
        >
          Chỉnh sửa
        </Button>
        <Button
          icon="delete"
          mode="contained"
          style={styles.deleteButton}
          onPress={() => handleDeleteApartment(item.id)}
        >
          Xoá
        </Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={{ padding: 5 }}>Đang tải dữ liệu...</Text>
      ) : (
        <>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="Tìm kiếm..."
          />
          <FlatList
            data={apartments}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderApartment}
            refreshControl={
              <RefreshControl refreshing={loading} onRefresh={onRefresh} />
            }
            ListFooterComponent={
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  onPress={handlePrevPage}
                  disabled={!prevPage}
                  style={[styles.pageButton, { opacity: currentPage === 1 ? 0.5 : 1 }]}
                >
                  <Ionicons name="chevron-back-outline" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.pageInfo}>{currentPage} / {totalPages}</Text>
                <TouchableOpacity
                  onPress={handleNextPage}
                  disabled={!nextPage}
                  style={[styles.pageButton, { opacity: currentPage === totalPages ? 0.5 : 1 }]}
                >
                  <Ionicons name="chevron-forward-outline" size={24} color="white" />
                </TouchableOpacity>
              </View>
            }
          />
        </>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setEditingApartment(null);
          setNumber('');
          setPrice('');
          setArea('');
          setHouseholdHead(null);
          setResidentsOptions([]);
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addText}>Thêm Căn Hộ</Text>
      </TouchableOpacity>

      {modalVisible && (
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity mode="outlined" style={styles.closeButton}
                onPress={() => {
                  setModalVisible(false);
                  setEditingApartment(null);
                  setNumber('');
                  setPrice('');
                  setArea('');
                  setHouseholdHead(null);
                  setResidentsOptions([]);
                }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingApartment ? 'Chỉnh sửa căn hộ' : 'Thêm căn hộ'}
            </Text>

            <Text>Số phòng:</Text>
            <TextInput
              style={styles.input}
              value={number}
              onChangeText={setNumber}
              placeholder="VD: 101"
              keyboardType="numeric"
            />

            <Text>Diện tích (m²):</Text>
            <TextInput
              style={styles.input}
              value={area}
              onChangeText={setArea}
              placeholder="VD: 80"
              keyboardType="numeric"
            />

            <Text>Giá (VND):</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="VD: 5000000"
              keyboardType="numeric"
            />

            <Text>Chủ hộ:</Text>
            <RNPickerSelect
              value={householdHead}
              onValueChange={(value) => setHouseholdHead(value)}
              items={residents.map((res) => ({
                label: res.name,
                value: res.id,
              }))}
              placeholder={{ label: 'Chọn chủ hộ (nếu có)', value: null }}
              style={{
                inputAndroid: styles.input,
              }}
            />

            <TouchableOpacity style={styles.modalButtons} onPress={handleSave}>
              <Text style={styles.saveButton}>Lưu</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 16,
  },
  residentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  residentNames: {
    fontSize: 16,
    color: '#555',
    marginTop: 5,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    backgroundColor: '#3498db',
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  addButton: {
    backgroundColor: '#2ecc71',
    position: 'absolute',
    bottom: 20,
    right: 20,
    padding: 10,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addText: {
    color: '#fff',
    marginLeft: 5,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  pageButton: {
    padding: 10,
    backgroundColor: '#4a90e2',
    borderRadius: 5,
    marginHorizontal: 8,
  },
  pageInfo: {
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    alignSelf: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  modalButtons: {
    marginTop: 20,
    backgroundColor: "#2ecc71",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    alignSelf: 'center',
    width: 100,
  },
  saveButton: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold" 
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 5,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
    marginBottom: 20,
    fontSize: 16,
  },
});

export default Apartments;
