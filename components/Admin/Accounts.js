import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Card, Avatar, Modal, Button } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [residents, setResidents] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [selectedResidentId, setSelectedResidentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [action, setAction] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const loadAccounts = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(endpoints.users, {
        params: {
          page: currentPage,
          page_size: itemsPerPage
        }
      });
      setAccounts(res.data);
      setFilteredAccounts(res.data);
      const totalCount = res.data.length;
      setTotalPages(Math.ceil(totalCount / itemsPerPage));
    } catch (err) {
      console.error("Lỗi khi tải tài khoản:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadResidents = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(endpoints.residents);
      setResidents(res.data);
    } catch (err) {
      console.error("Lỗi khi tải danh sách cư dân:", err);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query === "") {
      setFilteredAccounts(accounts);
    } else {
      const filtered = accounts.filter(account =>
        account.username.toLowerCase().includes(query.toLowerCase()) || 
        account.first_name.toLowerCase().includes(query.toLowerCase()) || 
        account.last_name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredAccounts(filtered);
    }
  };

  useEffect(() => {
    loadAccounts();
    loadResidents();
  }, [currentPage]);

  const handleAction = (action, account) => {
    setAction(action);
    if (action === "add") {
      setUsername("");
      setPassword("");
      setNewPassword("");
      setFirstName("");
      setLastName("");
      setSelectedResidentId(null);
    } else if (action === "edit") {
      setUsername(account.username);
      setPassword("");
      setNewPassword("");
      setFirstName(account.first_name);
      setLastName(account.last_name);
      setSelectedResidentId(account.resident?.id ?? null);
    } else {
      handleToggleLock(account);
      return;
    }
    setModalVisible(true);
  };

  const handleToggleLock = async (account) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const formData = new FormData();
      formData.append('is_active', (!account.is_active).toString());
      await authApis(token).patch(`/users/${account.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      loadAccounts();
    } catch (err) {
      console.error("Lỗi khi đổi trạng thái tài khoản:", err);
    }
  };

  const handleSave = async () => {
    if (!username || !firstName || !lastName || !selectedResidentId) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const formData = new FormData();

      formData.append('username', username);
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('resident', selectedResidentId);

      if (newPassword) {
        formData.append('password', newPassword);
      }

      if (action === "add") {
        await authApis(token).post(endpoints.users, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else if (action === "edit") {
        await authApis(token).patch(`/users/${selectedResidentId}/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      setModalVisible(false);
      loadAccounts();
    } catch (err) {
      console.error("Lỗi khi thực hiện hành động:", err);
    }
  };

  const renderAccountItem = ({ item: account }) => {
    const initials = account.first_name && account.last_name
      ? (account.first_name[0] + account.last_name[0]).toUpperCase()
      : account.username[0].toUpperCase();

    return (
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <Card.Title
            title={`@${account.username}`}
            subtitle={`${account.first_name} ${account.last_name}`}
            left={(props) =>
              account.avatar ? (
                <Avatar.Image {...props} source={{ uri: account.avatar }} size={40} />
              ) : (
                <Avatar.Text {...props} label={initials} size={40} color="#fff" />
              )
            }
          />
          <TouchableOpacity onPress={() => handleAction("lock", account)} style={styles.lockButton}>
            <Ionicons
              name={account.is_active ? "lock-closed-outline" : "lock-open-outline"}
              size={24}
              color={account.is_active ? "red" : "green"}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleAction("edit", account)} style={styles.editButton}>
            <Ionicons name="pencil" size={24} color="blue" />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm tài khoản..."
        value={searchQuery}
        onChangeText={handleSearch}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => handleAction("add")}>
        <Ionicons name="add" size={28} color="#fff" />
        <Text style={styles.addButtonText}>Thêm Tài Khoản</Text>
      </TouchableOpacity>

      {loading ? (
        <Text>Đang tải dữ liệu...</Text>
      ) : (
        <FlatList
          data={filteredAccounts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
          keyExtractor={(item) => item.id?.toString() ?? item.username}
          renderItem={renderAccountItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadAccounts} />}
          ListEmptyComponent={<Text style={styles.empty}>Không có tài khoản nào.</Text>}
          ListFooterComponent={
            <View style={styles.paginationContainer}>

              <TouchableOpacity
                onPress={handlePreviousPage}
                disabled={currentPage === 1}
                style={[styles.pageButton, { opacity: currentPage === 1 ? 0.5 : 1 }]} >
                <Ionicons name="chevron-back-outline" size={24} color="white" />
              </TouchableOpacity>

              <Text style={styles.pageInfo}>
                {currentPage} / {totalPages}
              </Text>

              <TouchableOpacity
                onPress={handleNextPage}
                disabled={currentPage === totalPages}
                style={[styles.pageButton, { opacity: currentPage === totalPages ? 0.5 : 1 }]} >
                <Ionicons name="chevron-forward-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modalContent}>
        <View style={styles.modalContentWrapper}>
          <Text style={styles.modalTitle}>
            {action === "edit" ? "Sửa tài khoản" : action === "add" ? "Thêm tài khoản" : "Khóa tài khoản"}
          </Text>

          {action !== "lock" && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Tên đăng nhập"
                value={username}
                onChangeText={setUsername}
              />
              {action !== "edit" && (
                <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              )}
              {action === "edit" && (
                <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu mới (nếu thay đổi)"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              )}
              <TextInput
                style={styles.input}
                placeholder="Họ"
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                style={styles.input}
                placeholder="Tên"
                value={lastName}
                onChangeText={setLastName}
              />

              {action === "add" && (
                <View style={{ width: "100%", marginBottom: 15 }}>
                  <View style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 8 }}>
                    <Picker
                      selectedValue={selectedResidentId}
                      onValueChange={(itemValue) => setSelectedResidentId(itemValue)}
                    >
                      <Picker.Item label="Chọn cư dân" value={null} />
                      {residents.map((r) => (
                        <Picker.Item
                          key={r.id}
                          label={r.name}
                          value={r.id}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              )}
            </>
          )}

          <View style={styles.buttonGroup}>
            <Button mode="contained" onPress={handleSave} style={styles.saveButton}>
              Lưu
            </Button>
            <Button mode="outlined" onPress={() => setModalVisible(false)} style={styles.cancelButton}>
              Hủy
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  addButton: {
    backgroundColor: "#2ecc71",
    position: "absolute",
    bottom: 20,
    right: 20,
    padding: 10,
    borderRadius: 50,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    zIndex: 10,
  },
  addButtonText: {
    color: "#fff",
    marginLeft: 5,
  },
  card: {
    marginBottom: 10,
    borderRadius: 10,
    elevation: 3,
    position: "relative",
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 10,
  },
  lockButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  editButton: {
    position: "absolute",
    top: 10,
    right: 40,
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
    color: "#333",
  },
  modalContentWrapper: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    margin: 20,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    width: "100%",
    marginBottom: 15,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  saveButton: {
    flex: 1,
    marginRight: 10,
  },
  cancelButton: {
    flex: 1,
    marginLeft: 10,
  },
  searchInput: {
    width: "100%",
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
    marginBottom: 15,
  },
});

export default Accounts;
