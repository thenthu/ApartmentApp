import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button, Modal, HelperText } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { authApis, endpoints } from "../../configs/Apis";
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import axios from 'axios';

const ChangePasswordAndAvatar = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const nav = useNavigation();
  const [imageOptionVisible, setImageOptionVisible] = useState(false);

  const validate = () => {
    if (!newPassword || !confirmPassword) {
      setMsg('Vui lòng điền đầy đủ thông tin mật khẩu!');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setMsg('Mật khẩu và xác nhận không khớp!');
      return false;
    }
    setMsg('');
    return true;
  };

  const uploadToCloudinary = async (uri) => {
    const data = new FormData();
    data.append('file', {
        uri: uri,
        name: 'avatar.jpg',
        type: 'image/jpeg',
    });
    data.append('upload_preset', 'unsigned_preset');
    
    try {
        console.log("Uploading image to Cloudinary with data:", data);
        const res = await axios.post('https://api.cloudinary.com/v1_1/dauhkaecb/image/upload', data);
        console.log("Cloudinary Response:", res.data);
        return res.data.secure_url;
    } catch (error) {
        console.log("Lỗi upload lên Cloudinary:", error.response ? error.response.data : error.message);
    }
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
    if (validate()) {
      setLoading(true);
      try {
        const formData = new FormData();

        if (newPassword) {
          formData.append('password', newPassword);
        }

        if (avatar) {
          formData.append('avatar', {
            uri: avatar,
            name: 'avatar.jpg',
            type: 'image/jpeg',
          });
        }

        const token = await AsyncStorage.getItem("token");
        const res = await authApis(token).patch(endpoints.current_user, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        console.log('Response:', res);
        nav.replace('home');
      } catch (error) {
        console.log(error);
        setMsg('Có lỗi xảy ra. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cập nhật tài khoản</Text>

      <HelperText type="error" visible={!!msg}>
        {msg}
      </HelperText>

      <TextInput
        placeholder="Mật khẩu mới"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        style={styles.input}
        mode="outlined"
      />

      <TextInput
        placeholder="Xác nhận mật khẩu"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
        mode="outlined"
      />

      <Button mode="outlined" onPress={() => setImageOptionVisible(true)} style={styles.button}>
        Chọn ảnh đại diện
      </Button>

      {avatar && (
        <Image
          source={{ uri: avatar }}
          style={styles.avatar}
          resizeMode="cover"
        />
      )}

      <Button
        mode="contained"
        onPress={handleSave}
        loading={loading}
        style={[styles.button, { backgroundColor: '#4a90e2' }]}
        disabled={loading}
      >
        Lưu thay đổi
      </Button>

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
    padding: 20,
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4a90e2',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  button: {
    width: "100%",
    marginBottom: 10,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginVertical: 20,
    borderWidth: 2,
    borderColor: '#4a90e2',
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

export default ChangePasswordAndAvatar;
