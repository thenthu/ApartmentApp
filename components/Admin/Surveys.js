import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, StyleSheet, TouchableWithoutFeedback, TouchableOpacity, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Card } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';
import { Ionicons } from "@expo/vector-icons";

const Surveys = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const surveysPerPage = 10;
  const navigation = useNavigation();

  const loadSurveys = async (searchQuery = '') => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const surveysRes = await authApis(token).get(endpoints.surveys);

      let filteredSurveys = surveysRes.data.filter(survey =>
        survey.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const sortedSurveys = filteredSurveys.sort(
        (a, b) => new Date(b.create_time) - new Date(a.create_time)
      );

      setSurveys(sortedSurveys);
      setTotalPages(Math.ceil(sortedSurveys.length / surveysPerPage));
    } catch (error) {
      console.error('Lỗi khi tải khảo sát:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách khảo sát.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    loadSurveys(text);
  };

  const renderItem = ({ item }) => (
    <TouchableWithoutFeedback onPress={() => navigation.navigate('SurveyDetails', { surveyId: item.id })}>
      <Card style={styles.card}>
        <Card.Title
          title={item.title}
          titleStyle={styles.cardTitle}
        />
      </Card>
    </TouchableWithoutFeedback>
  );

  const currentSurveys = surveys.slice((currentPage - 1) * surveysPerPage, currentPage * surveysPerPage);

  const onRefresh = () => {
    setRefreshing(true);
    loadSurveys(searchQuery);
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm khảo sát"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <View>
          <Text style={{ padding: 20 }}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={currentSurveys}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListFooterComponent={
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  onPress={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={[styles.pageButton, { opacity: currentPage === 1 ? 0.5 : 1 }]}>
                  <Ionicons name="chevron-back-outline" size={24} color="white" />
                </TouchableOpacity>

                <Text style={styles.pageInfo}>
                  {currentPage} / {totalPages}
                </Text>

                <TouchableOpacity
                  onPress={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={[styles.pageButton, { opacity: currentPage === totalPages ? 0.5 : 1 }]}>
                  <Ionicons name="chevron-forward-outline" size={24} color="white" />
                </TouchableOpacity>
              </View>
            }
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        </>
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddSurvey')}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addText}>Thêm Khảo Sát</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  pageButton: {
    backgroundColor: '#4a90e2',
    padding: 8,
    borderRadius: 5,
  },
  pageInfo: {
    marginHorizontal: 12,
    fontSize: 16,
    color: '#333',
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 3,
    backgroundColor: '#ffffff',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495e',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7f8c8d',
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
});

export default Surveys;
