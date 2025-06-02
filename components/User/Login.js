import { ScrollView, Text, View } from "react-native";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useContext, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { MyDispatchContext } from "../../configs/Contexts";

const Login = () => {
  const info = [
    {
      label: 'Tên đăng nhập',
      field: 'username',
      icon: 'account',
      secureTextEntry: false,
    },
    {
      label: 'Mật khẩu',
      field: 'password',
      icon: 'eye-off',
      secureTextEntry: true,
    },
  ];

  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState();
  const [showPassword, setShowPassword] = useState(false);
  const nav = useNavigation();
  const dispatch = useContext(MyDispatchContext);

  const setState = (value, field) => {
    setUser({ ...user, [field]: value });
  };

  const validate = () => {
    if (Object.values(user).length === 0) {
      setMsg("Vui lòng nhập thông tin!");
      return false;
    }

    for (let i of info) {
      if (user[i.field] === '') {
        setMsg(`Vui lòng nhập ${i.label}!`);
        return false;
      }
    }

    setMsg('');
    return true;
  };

  const login = async () => {
    if (validate() === true) {
      try {
        setLoading(true);
        
        let res = await Apis.post(endpoints.login, {
                    ...user, 
                    client_id: '5eqLWUoLXszkZZLQwXKYBV4BMz5PKGNv1XkTiTFs',
                    client_secret: '8dIvAcj71Ow4sTQyC206D0oeiObn51SyoOAkIgtliySTheMkOPWtap5Y6FvJeGBdhhZ2UU7nidRYCoDRvspHV0BXi2753M5YV4HNrrhJIurc52UmiIjdyV7bKsUGcgMj',
                    grant_type: 'password'
        });

        await AsyncStorage.setItem('token', res.data.access_token);

        let u = await authApis(res.data.access_token).get(endpoints.current_user);
        dispatch({
          type: 'login',
          payload: u.data,
        });

        if (u.data.avatar === "" && u.data.username != 'admin' ) {
          setTimeout(() => {
            nav.navigate('index', { screen: 'ChangePasswordAndAvatar' });
          }, 100);
        }

      } catch (ex) {
        if (ex.response) {
          console.log("Lỗi từ server:", ex.response?.data);
        } else if (ex.request) {
          console.log("Không nhận được phản hồi:", ex.request);
        } else {
          console.log("Lỗi cấu hình:", ex.message);
        }
        setMsg("Có lỗi xảy ra. Vui lòng thử lại.");
        console.log("Lỗi từ server:", ex);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Đăng nhập</Text>
      </View>

      <HelperText type="error" visible={!!msg}>
        {msg}
      </HelperText>

      {info.map(i => (
        <TextInput
          key={i.field}
          style={styles.input}
          label={i.label}
          secureTextEntry={i.field === 'password' ? !showPassword : i.secureTextEntry}
          right={
            i.field === 'password' ? (
              <TextInput.Icon
                icon={showPassword ? 'eye' : 'eye-off'}
                onPress={() => setShowPassword(!showPassword)}
              />
            ) : (
              <TextInput.Icon icon={i.icon} />
            )
          }
          value={user[i.field]}
          onChangeText={t => setState(t, i.field)}
        />
      ))}

      <Button
        onPress={login}
        disabled={loading}
        loading={loading}
        style={styles.button}
        mode="contained"
      >
        Đăng nhập
      </Button>
    </ScrollView>
  );
};

const styles = {
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    marginTop: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 15,
    borderRadius: 8,
    elevation: 3,
    paddingLeft: 10,
  },
  button: {
    backgroundColor: '#4a90e2',
    borderRadius: 8,
    marginTop: 20,
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    color: '#4a90e2',
    fontSize: 16,
  },
};

export default Login;
