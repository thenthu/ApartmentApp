import React, { useEffect, useContext } from 'react';
import { MyUserContext } from '../../configs/Contexts';
import { useNavigation } from '@react-navigation/native';

const ChatPerm = () => {
  const user = useContext(MyUserContext);
  const navigation = useNavigation();

  useEffect(() => {
    if (user.username === 'admin') {
      navigation.replace('MainChat');
    } else {
      navigation.replace('Chat', {
        username: 'admin',
        user,
        avatar: null,
      });
    }
  }, []);

  return null;
};

export default ChatPerm;
