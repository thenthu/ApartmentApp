import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Card } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';

const Surveys = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  const loadSurveys = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const surveysRes = await authApis(token).get(endpoints.surveys);

      const sortedSurveys = surveysRes.data.sort(
        (a, b) => new Date(b.create_time) - new Date(a.create_time)
      );

      setSurveys(sortedSurveys);
    } catch (error) {
      console.error('Lỗi khi tải khảo sát:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách khảo sát.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('SurveyDetail', { surveyId: item.id })}>
      <Card style={styles.card}>
        <Card.Title
          title={item.title}
          titleStyle={styles.cardTitle}
        />
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Đang tải khảo sát...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={surveys}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
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
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
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
});

export default Surveys;
