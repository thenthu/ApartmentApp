import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icon } from "react-native-paper";
import { MyDispatchContext, MyUserContext } from "./configs/Contexts";
import { useContext, useReducer } from "react";
import MyUserReducer from "./reducers/MyUserReducer";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import Home from "./components/Home/Home";
import Login from "./components/User/Login";
import Profile from "./components/User/Profile";
import MyInvoices from "./components/Resident/MyInvoices";
import MyLockers from "./components/Resident/MyLockers";
import MyComplaints from "./components/Resident/MyComplaints";
import Residents from "./components/Admin/Residents";
import ResidentDetails from "./components/Admin/ResidentDetail";
import Accounts from "./components/Admin/Accounts";
import Payments from "./components/Admin/Payments";
import Lockers from "./components/Admin/Lockers";
import LockerDetails from "./components/Admin/LockerDetails";
import Complaints from "./components/Admin/Complaints";
import Surveys from "./components/Admin/Surveys";
import SubMenu from "./components/Admin/SubMenu";
import Guests from "./components/Admin/Guests";
import ChangePasswordAndAvatar from "./components/User/ChangePasswordAndAvatar";
import GuestDetails from "./components/Admin/GuestDetails";
import Chat from "./components/Home/Chat";
import MainChat from "./components/Home/MainChat";
import ChatPerm from "./components/Home/ChatPerm";

const getTabBarStyle = (route) => {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'home';

  const hiddenScreens = [
    'Residents',
    'ResidentDetails',
    'MyInvoices',
    'MyLockers',
    'MyComplaints',
    'Accounts',
    'Payments',
    'Lockers',
    "LockerDetails",
    "Complaints",
    "Surveys",
    "SubMenu",
    "Guest",
    'ChangePasswordAndAvatar',
    'Guests',
    'GuestDetails',
  ];

  if (hiddenScreens.includes(routeName)) {
    return { display: 'none' };
  }
};

const Stack = createNativeStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="home" component={Home} options={{ headerShown: false }} />
      <Stack.Screen name="SubMenu" component={SubMenu} options={{ title: "" }} />
      <Stack.Screen name="Residents" component={Residents} options={{ title: "Danh sách cư dân" }} />
      <Stack.Screen name="ResidentDetails" component={ResidentDetails} options={{ title: "Chi tiết cư dân" }} />
      <Stack.Screen name="Guests" component={Guests} options={{ title: "Danh sách khách" }} />
      <Stack.Screen name="GuestDetails" component={GuestDetails} options={{ title: "Thông tin khách" }} />
      <Stack.Screen name="MyInvoices" component={MyInvoices} options={{ title: "Danh sách hóa đơn" }} />
      <Stack.Screen name="MyLockers" component={MyLockers} options={{ title: "" }} />
      <Stack.Screen name="MyComplaints" component={MyComplaints} options={{ title: "" }} />
      <Stack.Screen name="Accounts" component={Accounts} options={{ title: "Danh sách tài khoản" }} />
      <Stack.Screen name="Payments" component={Payments} options={{ title: "Danh sách hóa đơn" }} />
      <Stack.Screen name="Lockers" component={Lockers} options={{ title: "Danh sách tủ đồ" }} />
      <Stack.Screen name="LockerDetails" component={LockerDetails} options={{ title: "Chi tiết tủ đồ" }} />
      <Stack.Screen name="Complaints" component={Complaints} options={{ title: "Phản ánh của cư dân" }} />
      <Stack.Screen name="Surveys" component={Surveys} options={{ title: "Khảo sát" }} />
      <Stack.Screen name="ChangePasswordAndAvatar" component={ChangePasswordAndAvatar} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={Chat} options={{ title: "" }} />
    </Stack.Navigator>
  );
}

const ChatStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ChatPerm" component={ChatPerm} options={{ headerShown: false }} />
      <Stack.Screen name="MainChat" component={MainChat} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={Chat} options={{ title: '' }} />
    </Stack.Navigator>
  );
};

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const user = useContext(MyUserContext);
  return (
    <Tab.Navigator>
      {user === null ? (
        <>
          <Tab.Screen
            name="login"
            component={Login}
            options={{
              title: 'Đăng nhập',
              headerShown: false,
              tabBarStyle: { display: 'none' },
              tabBarIcon: () => <Icon size={30} source="account" />,
            }}
          />
        </>
      ) : (
        <>
          <Tab.Screen
            name="index"
            component={StackNavigator}
            options={({ route }) => ({
              headerShown: false,
              title: 'Trang chủ',
              tabBarIcon: () => <Icon size={30} source="home" />,
              tabBarStyle: getTabBarStyle(route),
            })}
          />
          <Tab.Screen
            name="chat"
            component={ChatStack}
            options={{
              headerShown: false,
              title: 'Chat',
              tabBarIcon: () => <Icon size={30} source="message" />,
            }}
          />
          <Tab.Screen
            name="profile"
            component={Profile}
            options={{
              headerShown: false,
              title: 'Tài khoản',
              tabBarIcon: () => <Icon size={30} source="account" />,
            }}
          />
        </>
      )}
    </Tab.Navigator>
  );
}

const App = () => {
  const [user, dispatch] = useReducer(MyUserReducer, null);

  return (
    <MyUserContext.Provider value={user}>
      <MyDispatchContext.Provider value={dispatch}>
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      </MyDispatchContext.Provider>
    </MyUserContext.Provider>
  );
}

export default App;