import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';  // Đảm bảo đã import StyleSheet
import { Ionicons } from '@expo/vector-icons';
import { MyUserContext } from "../../configs/Contexts";
import Apis, { endpoints } from "../../configs/Apis";

const Home = ({ navigation }) => {
  const user = useContext(MyUserContext);

  const residentMenu = [
    { title: "Thanh toán phí", icon: "card", screen: "MyInvoices" },
    { title: "Tủ đồ của tôi", icon: "cube", screen: "MyLockers" },
    { title: "Gửi phản ánh", icon: "alert-circle", screen: "MyComplaints" },
    { title: "Tham gia khảo sát", icon: "stats-chart", screen: "MySurveys" },
    { title: "Đăng ký khách", icon: "person-add", screen: "MyVisitors" },
    { title: "Lịch sử hóa đơn", icon: "document-text", screen: "InvoiceHistory" },
  ];

  const adminMenu = [
    { title: "Quản lý cư dân", icon: "people", screen: "SubMenu" },
    { title: "Quản lý tài khoản", icon: "person-add", screen: "Accounts" },
    { title: "Quản lý hóa đơn", icon: "file-tray", screen: "Payments" },
    { title: "Quản lý tủ đồ", icon: "cube", screen: "Lockers" },
    { title: "Phản ánh", icon: "alert-circle", screen: "Complaints" },
    { title: "Khảo sát cư dân", icon: "stats-chart", screen: "Surveys" },
  ];

  const menu = user.resident == null ? adminMenu : residentMenu;

  const handlePress = (screen) => {
    const isConnected = true;
    if (isConnected) {
      navigation.navigate(screen);
    } else {
      Alert.alert("Lỗi", "Không có kết nối internet!");
    }
  };

  useEffect(() => {
  navigation.setOptions({
    title: "Danh sách cư dân",
    headerRight: () => (
      <TouchableOpacity onPress={() => navigation.navigate("AddResident")}>
        <Text style={{ marginRight: 15, color: "#007bff", fontWeight: "bold" }}>
          Thêm
        </Text>
      </TouchableOpacity>
    ),
  });
}, []);


  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.topSection}>
        <View style={styles.greetingContainer}>
          <Text style={styles.welcome}>XIN CHÀO</Text>
          <Text style={styles.name}>{user.resident == null ? 'Admin' : user.resident.name.toUpperCase()}</Text>
          <Text style={styles.role}>{user.resident == null ? 'BAN QUẢN LÝ' : 'CƯ DÂN'}</Text>
        </View>
      </View>

      <View style={styles.middleSection}>
        <Text style={[styles.infoText, styles.buildingName]}>🏢 OU Building</Text>
        <Text style={styles.infoText}>📍 Khu dân cư Nhơn Đức, Huyện Nhà Bè, Thành phố Hồ Chí Minh</Text>
        <Text style={styles.infoText}> {user.resident == null ? '🚪 14 phòng' : `🚪 Phòng ${user.resident.apartment?.number}`}</Text>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.menuContainer}>
          {menu.map((item, idx) => (
            <TouchableOpacity key={idx} style={styles.card} onPress={() => handlePress(item.screen)}>
              <Ionicons name={item.icon} size={32} color="#ffffff" style={styles.icon} />
              <Text style={styles.cardText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f5f5f5",
  },
  topSection: {
    flex: 2,
    height: 230,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4a90e2',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  bottomSection: {
    flex: 1,
    padding: 20,
  },
  greetingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcome: {
    fontSize: 20,
    color: "#ffffff",
  },
  name: {
    fontSize: 24,
    color: "#ffffff",
    marginTop: 12,
    fontWeight: '600',
  },
  role: {
    position: 'absolute',
    top: 100,
    backgroundColor: "#ffffff",
    padding: 8,
    borderRadius: 5,
    alignSelf: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
  },
  menuContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  middleSection: {
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 16,
    color: "#666",
    marginVertical: 4,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  buildingName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    width: '47%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    backgroundColor: "#4a90e2",
  },
  cardText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
    color: "#ffffff",
    fontWeight: '500',
  },
  icon: {
    marginBottom: 4,
  }
});

export default Home;
