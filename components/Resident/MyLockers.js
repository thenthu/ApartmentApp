import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { MyUserContext } from "../../configs/Contexts";
import { authApis } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";

const MyLockers = () => {
  const user = useContext(MyUserContext);
  const residentId = user.resident?.id;

  const [locker, setLocker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [itemsStatus, setItemsStatus] = useState({});

  useEffect(() => {
    const fetchLocker = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await authApis(token).get(`/residents/${residentId}/lockeritem/`);
        setLocker(res.data);

        const statusPromises = res.data.items.map(async (item) => {
          const itemRes = await authApis(token).get(`/residents/${residentId}/lockeritem/item/${item.id}`);
          return { [item.id]: itemRes.data.status };
        });

        const statuses = await Promise.all(statusPromises);

        const statusesObject = statuses.reduce((acc, status) => {
          return { ...acc, ...status };
        }, {});

        setItemsStatus(statusesObject);

      } catch (err) {
        console.error("Lỗi tải tủ đồ:", err);
      } finally {
        setLoading(false);
      }
    };

    if (residentId) fetchLocker();
  }, [residentId]);

  const updateStatus = async (itemId, status) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await authApis(token).put(`/residents/${residentId}/lockeritem/item/${itemId}`, { status });

      setItemsStatus((prevStatus) => ({
        ...prevStatus,
        [itemId]: status,
      }));
    } catch (error) {
      console.error("Lỗi cập nhật trạng thái:", error);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#007bff" style={styles.loader} />;
  }

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>📦 {item.name_item}</Text>
      <Text style={styles.statusText}>Trạng thái:</Text>

      <Picker
        selectedValue={itemsStatus[item.id]}
        onValueChange={(value) => updateStatus(item.id, value)}
        style={styles.picker}
      >
        <Picker.Item label="Chờ nhận" value="waiting" style={styles.waitingText} />
        <Picker.Item label="Đã nhận" value="received" style={styles.receivedText} />
      </Picker>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tủ đồ số: {locker?.locker_number}</Text>
      <Text style={styles.subtitle}>Danh sách vật phẩm:</Text>

      <FlatList
        data={locker?.items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>Không có vật phẩm nào trong tủ.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa", 
    padding: 20 
  },

  title: { 
    fontSize: 20, 
    fontWeight: "bold", 
    marginBottom: 10, 
    color: "#333" 
  },

  subtitle: { 
    fontSize: 16, 
    fontWeight: "600", 
    marginBottom: 10, 
    color: "#666" 
  },

  item: {
    backgroundColor: "#fff", 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 10, 
    shadowColor: "#000", 
    shadowOpacity: 0.1, 
    shadowRadius: 3, 
    elevation: 2 
  },

  itemText: { 
    fontSize: 16, 
    color: "#333" 
  },

  statusText: { 
    fontSize: 14, 
    color: "#666", 
    marginTop: 5 
  },

  picker: { 
    marginTop: 5, 
    height: 54, 
    backgroundColor: "#fff", 
    borderRadius: 8 
  },

  waitingText: { 
    color: "orange" 
  },

  receivedText: { 
    color: "green" 
  },  // Màu xanh cho "Đã nhận"

  empty: { 
    color: "#999", 
    fontStyle: "italic" 
  },

  loader: { 
    flex: 1, 
    justifyContent: "center" 
  },
});

export default MyLockers;
