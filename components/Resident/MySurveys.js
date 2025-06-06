import React, { useEffect, useState, useContext } from 'react';
import { View, FlatList, ActivityIndicator, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Card, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyUserContext } from "../../configs/Contexts";
import { authApis, endpoints } from "../../configs/Apis";
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from "@expo/vector-icons";

const MySurveys = () => {
  const [surveys, setSurveys] = useState([]);
  const [filteredSurveys, setFilteredSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const surveysPerPage = 3;
  const user = useContext(MyUserContext);
  const navigation = useNavigation();

  useEffect(() => {
    const loadSurveys = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const residentId = user?.resident?.id;

        const res = await authApis(token).get(`${endpoints.residents}${residentId}/surveys/`);

        const sortedSurveys = res.data.sort((a, b) => new Date(b.deadline) - new Date(a.deadline));
        setSurveys(sortedSurveys);
        setFilteredSurveys(sortedSurveys);
        setTotalPages(Math.ceil(sortedSurveys.length / surveysPerPage));
      } catch (err) {
        console.error(err);
        setError("Không thể tải khảo sát.");
      } finally {
        setLoading(false);
      }
    };

    loadSurveys();
  }, [user]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    const filtered = surveys.filter((survey) =>
      survey.title.toLowerCase().includes(text.toLowerCase()) ||
      (survey.description && survey.description.toLowerCase().includes(text.toLowerCase()))
    );
    setFilteredSurveys(filtered);
    setTotalPages(Math.ceil(filtered.length / surveysPerPage));
    setCurrentPage(1);
  };

  const handleDoSurvey = (surveyId) => {
    navigation.navigate('DoSurvey', { surveyId });
  };

  const renderSurveyItem = ({ item }) => {
    const isExpired = new Date(item.deadline) < new Date();

    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description || 'Không có mô tả'}</Text>
          <Text style={styles.date}>
            Hạn chót: {new Date(item.deadline).toLocaleDateString('vi-VN')}
          </Text>
        </Card.Content>
        {!isExpired && (
          <Card.Actions>
            <Button onPress={() => handleDoSurvey(item.id)}>Làm khảo sát</Button>
          </Card.Actions>
        )}
      </Card>
    );
  };

  const currentSurveys = filteredSurveys.slice((currentPage - 1) * surveysPerPage, currentPage * surveysPerPage);

  if (loading) return <ActivityIndicator style={{ marginTop: 30 }} />;

  if (error) return (
    <View style={{ padding: 20 }}>
      <Text>{error}</Text>
    </View>
  );

  if (surveys.length === 0) return (
    <View style={{ padding: 20 }}>
      <Text>Không có khảo sát nào.</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm khảo sát"
        value={searchQuery}
        onChangeText={handleSearch}
      />

      <FlatList
        data={currentSurveys}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSurveyItem}
        ListFooterComponent={
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              onPress={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={[styles.pageButton, { opacity: currentPage === 1 ? 0.5 : 1 }]}
            >
              <Ionicons name="chevron-back-outline" size={24} color="white" />
            </TouchableOpacity>

            <Text style={styles.pageInfo}>
              {currentPage} / {totalPages}
            </Text>

            <TouchableOpacity
              onPress={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={[styles.pageButton, { opacity: currentPage === totalPages ? 0.5 : 1 }]}
            >
              <Ionicons name="chevron-forward-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 10,
    paddingBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  description: {
    marginTop: 4,
    fontSize: 14,
    color: '#444',
  },
  date: {
    marginTop: 8,
    fontSize: 12,
    color: 'gray',
  },
  searchInput: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingLeft: 10,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  pageButton: {
    backgroundColor: "#4a90e2",
    padding: 8,
    borderRadius: 5,
  },
  pageInfo: {
    marginHorizontal: 12,
    fontSize: 16,
    color: "#333",
  },
});

export default MySurveys;
