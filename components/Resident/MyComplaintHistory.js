import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { MyUserContext } from "../../configs/Contexts";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";

const MyComplaintHistory = () => {
  const user = useContext(MyUserContext);
  const residentId = user.resident?.id;

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadComplaints = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(endpoints.complaints);

      const detailedComplaints = await Promise.all(
        res.data.map(async (item) => {
          if (item.is_resolved) {
            try {
              const complaintDetails = await authApis(token).get(
                `${endpoints.complaints}/${item.id}`
              );
              return { ...item, ...complaintDetails.data };
            } catch (error) {
              console.error("Lỗi khi tải chi tiết phản ánh:", error);
              return item;
            }
          }
          return item;
        })
      );

      setComplaints(detailedComplaints);
    } catch (error) {
      console.error("Lỗi khi tải phản ánh:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const renderComplaint = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.status}>
        Trạng thái: {item.is_resolved ? "Đã giải quyết" : "Chưa giải quyết"}
      </Text>
      <Text style={styles.date}>
        Ngày tạo: {new Date(item.create_time).toLocaleString()}
      </Text>
      {item.is_resolved && item.responses && item.responses.length > 0 && (
        <View style={styles.responses}>
          <Text style={styles.responsesHeader}>Phản hồi:</Text>
          {item.responses.map((response, index) => (
            <Text key={index} style={styles.responseText}>
              {response.content}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderComplaint}
          ListEmptyComponent={<Text>Không có phản ánh nào.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  item: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  status: {
    marginTop: 5,
    fontSize: 14,
    color: "#555",
  },
  date: {
    marginTop: 5,
    fontSize: 12,
    color: "#777",
  },
  responses: {
    marginTop: 10,
    paddingLeft: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  responsesHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  responseText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  loader: {
    marginTop: 50,
  },
});

export default MyComplaintHistory;
