import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Card } from 'react-native-paper';
import { authApis, endpoints } from '../../configs/Apis';
import { MyUserContext } from '../../configs/Contexts';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";

const MainChat = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const user = useContext(MyUserContext);
  const navigation = useNavigation();

  const loadUsers = async () => {
    try {
        const token = await AsyncStorage.getItem("token");
        const usersRes = await authApis(token).get(endpoints.users);

        const filteredUsers = usersRes.data.filter(user => user.username !== 'admin');
        
        setUsers(filteredUsers);
    } catch (err) {
        console.error("Lỗi khi tải người dùng:", err);
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const goToChat = (username, avatar) => {
    navigation.navigate('Chat', {
      username,
      user,
      avatar,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Đang tải danh sách cư dân...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => goToChat(item.username, item.avatar)} style={styles.cardContainer}>
            <Card style={styles.card}>
              <View style={styles.cardContent}>
                {item.avatar ? (
                  <Card.Cover 
                    source={{ uri: item.avatar }} 
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}></View>
                )}
                <Card.Title title={item.resident?.name || 'Không có tên'} subtitle={item.username} />
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
    marginTop:50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  cardContainer: {
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 15,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    backgroundColor: '#dcdcdc',
    borderRadius: 20,
    marginRight: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6200ee',
  },
});

export default MainChat;
