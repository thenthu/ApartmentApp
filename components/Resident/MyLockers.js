import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { MyUserContext } from "../../configs/Contexts";
import { authApis } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

  if (loading) {
    return <Text style={{ padding: 20 }}>Đang tải dữ liệu...</Text>;
  }

  const renderItem = ({ item }) => {
    const status = itemsStatus[item.id];
    const statusLabel = status === "received" ? "Đã nhận" : "Chờ nhận";
    const statusColor = status === "received" ? styles.receivedText : styles.waitingText;

    return (
      <View style={styles.item}>
        <Text style={styles.itemText}>📦 {item.name_item}</Text>
        <Text style={[styles.statusText, styles.statusValue, statusColor]}>
          {statusLabel}
        </Text>
      </View>
    );
  };

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

  statusValue: { 
    fontSize: 15, 
    marginTop: 5, 
    fontWeight: "500" 
  },

  waitingText: { 
    color: "orange" 
  },

  receivedText: { 
    color: "green" 
  },

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
