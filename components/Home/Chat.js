import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { database } from '../../firebaseConfig';
import { ref, onValue, push } from 'firebase/database';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useLayoutEffect } from 'react';
import { Avatar } from 'react-native-paper'; 

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const route = useRoute();
  const { username, user, avatar } = route.params;
  const chatRoomId = user.username == 'admin'
    ? `${user.username}-${username}`
    : `admin-${user.username}`;

  const chatRef = ref(database, `chats/${chatRoomId}`);
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
        title: `Tin nhắn với ${username}`,
    });
  }, [username]);


  useEffect(() => {
    const callback = snapshot => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        setMessages(parsed.reverse());
      }
    };

    const unsubscribe = onValue(chatRef, callback);
    return () => unsubscribe();
  }, []);

  const sendMessage = () => {
    if (text.trim() === '') return;
    push(chatRef, {
      text,
      sender: user.username,
      receiver: username,
      timestamp: Date.now(),
    });
    setText('');
  };

  const renderItem = ({ item }) => {
    const isSender = item.sender === user.username;
    const time = new Date(item.timestamp).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });

    return (
        <View style={[styles.messageRow, isSender ? styles.rightAlign : styles.leftAlign]}>
            {!isSender && (
                <View style={styles.avatarContainer}>
                {user.username !== 'admin' ? (
                    <Avatar.Icon icon="account" size={40} />
                ) : (
                    <Image source={{ uri: avatar }} style={styles.avatar} />
                )}
                </View>
            )}
            <View style={[styles.messageContainer, isSender ? styles.sender : styles.receiver]}>
                <Text style={[styles.messageText, isSender ? styles.senderText : styles.receiverText]}>{item.text}</Text>
                <Text style={[styles.metaText, isSender ? styles.senderMeta : styles.receiverMeta]}>
                {time}
                </Text>
            </View>
        </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior='padding'
      keyboardVerticalOffset='0'
    >
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        inverted
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 10 }}
      />
      <View style={styles.inputContainer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Nhập tin nhắn..."
          style={styles.input}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Gửi</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 13,
  },
  leftAlign: {
    alignSelf: 'flex-start',
  },
  rightAlign: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    marginRight: 6,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageContainer: {
    padding: 10,
    maxWidth: '75%',
    borderRadius: 10,
  },
  sender: {
    backgroundColor: '#007aff',
  },
  receiver: {
    backgroundColor: '#fff',
  },
  messageText: {
    fontSize: 16,
  },
  senderText: {
    color: '#fff',
  },
  receiverText: {
    color: '#000',
  },
  metaText: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  senderMeta: {
    color: '#eee',
  },
  receiverMeta: {
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    width: "100%",
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#007aff',
    paddingHorizontal: 20,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});


export default Chat;
