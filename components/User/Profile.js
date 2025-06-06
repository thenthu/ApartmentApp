import { useContext, useState } from "react";
import { Text, View, Image, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { MyDispatchContext, MyUserContext } from "../../configs/Contexts";
import { Button, Modal } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';

const quanHeVietHoa = {
    "owner": "Chủ hộ",
    "wife/husband": "Vợ/Chồng",
    "child": "Con cái",
    "other": "Khác"
};

const Profile = () => {
    const user = useContext(MyUserContext);
    const dispatch = useContext(MyDispatchContext);
    const nav = useNavigation();

    const [isEditing, setIsEditing] = useState(false);
    const [username, setUsername] = useState(user?.username || "");
    const [residentName, setResidentName] = useState(user?.resident?.name || "");
    const [relationship, setRelationship] = useState(user?.resident?.relationship_to_head || "owner");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [avatar, setAvatar] = useState(null);
    const [imageOptionVisible, setImageOptionVisible] = useState(false);
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(null);


    const logout = () => {
        dispatch({ type: "logout" });
        nav.navigate("index");
    };

    const validate = () => {
        if (newPassword || confirmPassword) {
            if (!newPassword || !confirmPassword) {
                setMsg('Vui lòng điền đầy đủ thông tin mật khẩu!');
                return false;
            }
            if (newPassword !== confirmPassword) {
                setMsg('Mật khẩu và xác nhận không khớp!');
                return false;
            }
        }
        setMsg('');
        return true;
    };

    const requestImagePermission = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Lỗi", "Vui lòng cấp quyền truy cập vào album ảnh.");
        }
    };
    
    const requestCameraPermission = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Lỗi", "Vui lòng cấp quyền truy cập vào máy ảnh.");
        }
    };

    const uploadToCloudinary = async (uri) => {
    const data = new FormData();
    data.append('file', {
        uri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
    });
    data.append('upload_preset', 'react-native-upload');

    try {
        const response = await fetch('https://api.cloudinary.com/v1_1/depjn7fdk/image/upload', {
        method: 'POST',
        body: data,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        });

        const json = await response.json();

        if (response.ok) {
        console.log("Cloudinary Response:", json);
        return json.secure_url;
        } else {
        console.log("Cloudinary upload failed:", json);
        }
    } catch (error) {
        console.log("Lỗi upload lên Cloudinary:", error.message);
    }
    };
        
    const pickImage = async () => {
        try {
          await requestImagePermission();
          let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
          });
          if (!result.canceled) {
            const uri = result.assets[0].uri;
            setAvatar(uri);
            setImageOptionVisible(false);
            console.log("Ảnh đã chọn:", uri);
    
            const url = await uploadToCloudinary(uri);
            setAvatarUrl(url);
          }
        } catch (err) {
          console.log("Lỗi");
        }
    };
    
    const takePhoto = async () => {
        try {
          await requestCameraPermission();
          let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
          });
          if (!result.canceled) {
            const uri = result.assets[0].uri;
            setAvatar(uri);
            setImageOptionVisible(false);
    
            const url = await uploadToCloudinary(uri);
            setAvatarUrl(url);
          }
        } catch (err) {
          console.log("Lỗi");
        }
    };

    const handleSave = async () => {
        console.log("Đã nhấn lưu");
        if (validate()) {
            setLoading(true);
            try {
                const formData = new FormData();

                if(username) {
                    formData.append('username', username);
                }

                if(relationship) {
                    formData.append('relationship_to_head', relationship);
                }

                if (newPassword) {
                formData.append('password', newPassword);
                }

                if (avatarUrl) {
                formData.append('avatar', avatarUrl);
                }
                console.log(avatarUrl);

                const token = await AsyncStorage.getItem("token");
                const res = await authApis(token).patch(endpoints.current_user, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                });

            } catch (error) {
                console.log(error);
                setMsg('Có lỗi xảy ra. Vui lòng thử lại.');
            } finally {
                setLoading(false);
                setIsEditing(false);
            }
        }
    };

    return (
        <View style={styles.container}>
            {isEditing ? (
            <TouchableOpacity onPress={() => setImageOptionVisible(true)}>
                <Image
                source={{ uri: avatar || user?.avatar }}
                style={styles.avatar}
                />
            </TouchableOpacity>
            ) : (
            (avatar || user?.avatar) && (
                <Image
                source={{ uri: avatar || user?.avatar }}
                style={styles.avatar}
                />
            )
            )}

            <Text style={styles.name}>
                {user?.last_name} {user?.first_name}
            </Text>

            {!isEditing && (
                <Text style={styles.username}>@{username}</Text>
            )}

            {user?.resident && !isEditing && (
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>Họ và tên: {user.resident.name}</Text>
                    <Text style={styles.infoText}>
                        Quan hệ với chủ hộ: {quanHeVietHoa[user.resident.relationship_to_head] || "Không rõ"}
                    </Text>
                </View>
            )}

            {isEditing && (
                <View style={styles.formGroup}>
                    <TextInput
                        value={username}
                        onChangeText={setUsername}
                        style={styles.input}
                        placeholder="Username"
                    />
                    <Text style={styles.input}>{residentName}</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={relationship}
                            onValueChange={setRelationship}
                            style={styles.picker}
                        >
                            <Picker.Item label="Chủ hộ" value="owner" />
                            <Picker.Item label="Vợ/Chồng" value="wife/husband" />
                            <Picker.Item label="Con cái" value="child" />
                            <Picker.Item label="Khác" value="other" />
                        </Picker>
                    </View>
                    <TextInput
                        value={newPassword}
                        onChangeText={setNewPassword}
                        style={styles.input}
                        placeholder="Mật khẩu mới"
                        secureTextEntry
                    />
                    <TextInput
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        style={styles.input}
                        placeholder="Xác nhận mật khẩu"
                        secureTextEntry
                    />
                </View>
            )}

            {!isEditing ? (
                <View>
                    {username !== "admin" && (
                        <Button
                            onPress={() => setIsEditing(true)}
                            mode="outlined"
                            style={styles.editBtn}
                            labelStyle={{ fontSize: 16 }}
                        >
                            Chỉnh sửa thông tin
                        </Button>
                    )}
                    <Button
                        onPress={logout}
                        mode="contained"
                        style={styles.logoutBtn}
                        labelStyle={{ fontSize: 16 }}
                    >
                        Đăng xuất
                    </Button>
                </View>
            ) : (
                <View style={styles.editActions}>
                    <Button
                        onPress={() => {
                            handleSave();
                            setUsername(user?.username || "");
                            setResidentName(user?.resident?.name || "");
                            setRelationship(user?.resident?.relationship_to_head);
                            setNewPassword("");
                            setConfirmPassword("");
                        }}
                        mode="contained"
                        style={styles.saveButton}
                        labelStyle={{ fontSize: 16 }}
                    >
                        Lưu thay đổi
                    </Button>
                    <Button
                        onPress={() => {
                            setUsername(user?.username || "");
                            setResidentName(user?.resident?.name || "");
                            setRelationship(user?.resident?.relationship_to_head);
                            setNewPassword("");
                            setConfirmPassword("");
                            setIsEditing(false);
                        }}
                        mode="outlined"
                        style={styles.cancelButton}
                        labelStyle={{ fontSize: 16 }}
                    >
                        Hủy
                    </Button>
                </View>
            )}

            <Modal visible={imageOptionVisible} onDismiss={() => setImageOptionVisible(false)} >
                <View style={styles.modalContentWrapper}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => setImageOptionVisible(false)}>
                        <Ionicons name="close" size={30} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Chọn ảnh đại diện</Text>
                    <Button mode="outlined" onPress={pickImage} style={styles.button}>
                        Chọn từ album
                    </Button>
                    <Button mode="outlined" onPress={takePhoto} style={styles.button}>
                        Chụp ảnh
                    </Button>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 20,
        justifyContent: 'center',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 20,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    username: {
        fontSize: 16,
        color: '#888',
        marginBottom: 10,
    },
    infoBox: {
        marginVertical: 20,
        alignItems: 'center',
    },
    infoText: {
        fontSize: 16,
        color: '#444',
        marginBottom: 5,
    },
    logoutBtn: {
        backgroundColor: '#e74c3c',
        paddingHorizontal: 20,
        borderRadius: 10,
        marginTop: 20,
    },
    editBtn: {
        marginTop: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        borderColor: '#4CAF50',
        borderWidth: 1,
    },
    formGroup: {
        width: '100%',
        marginTop: 20,
        gap: 12,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#fff',
    },
    picker: {
        width: '100%',
    },
    editActions: {
        width: '100%',
        marginTop: 20,
        gap: 10,
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 10,
    },
    cancelButton: {
        borderRadius: 10,
        borderColor: '#ccc',
        borderWidth: 1,
    },
    button: {
        width: "100%",
        marginBottom: 10,
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
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 5,
    },
});

export default Profile;
