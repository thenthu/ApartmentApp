import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApis, endpoints } from '../../configs/Apis';
import { Ionicons } from "@expo/vector-icons";
import { RadioButton } from 'react-native-paper';

const AddSurvey = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [questions, setQuestions] = useState([
    { text: '', type: 'single', choices: [''] },
  ]);
  const navigation = useNavigation();

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: '', type: 'single', choices: [''] }]);
  };

  const handleAddChoice = (qIndex) => {
    const updated = [...questions];
    updated[qIndex].choices.push('');
    setQuestions(updated);
  };
  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const handleDateTextChange = (text) => {
    const parts = text.split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts.map(Number);
        const parsed = new Date(year, month - 1, day);
        if (!isNaN(parsed.getTime())) {
        setDeadline(parsed);
        }
    }
  };

  const handleChangeQuestionText = (qIndex, value) => {
    const updated = [...questions];
    updated[qIndex].text = value;
    setQuestions(updated);
  };

  const handleChangeQuestionType = (qIndex, value) => {
    const updated = [...questions];
    updated[qIndex].type = value;
    setQuestions(updated);
  };

  const handleChangeChoice = (qIndex, cIndex, value) => {
    const updated = [...questions];
    updated[qIndex].choices[cIndex] = value;
    setQuestions(updated);
  };

  const handleSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const formattedQuestions = questions.map((q) => ({
        text: q.text,
        type: q.type,
        choices: q.choices.map((c) => ({ text: c })),
      }));

      const deadlineAtEndOfDay = new Date(deadline);
      deadlineAtEndOfDay.setHours(23, 59, 59, 999);

      await authApis(token).post(endpoints.surveys, {
        title,
        description,
        deadline: deadlineAtEndOfDay.toLocaleString(),
        questions: formattedQuestions,
      });

      Alert.alert('Thành công', 'Khảo sát đã được tạo.');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tạo khảo sát.');
    }
  };

  return (
    <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
        <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        >
        <Text style={styles.label}>Tiêu đề</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Mô tả</Text>
        <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            multiline
        />

        <Text style={styles.label}>Hạn chót</Text>
        <View style={styles.dateInputContainer}>
        <TextInput
            style={styles.dateInput}
            placeholder="DD/MM/YYYY"
            value={formatDate(deadline)}
            onChangeText={handleDateTextChange}
            keyboardType="numeric"
        />
        <TouchableOpacity onPress={() => setShowPicker(true)}>
            <Ionicons name="calendar-outline" size={28} color="#333" />
        </TouchableOpacity>
        </View>

        {showPicker && (
            <DateTimePicker
            value={deadline}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
                if (selectedDate) setDeadline(selectedDate);
                setShowPicker(false);
            }}
            />
        )}

        <Text style={styles.label}>Câu hỏi</Text>
        {questions.map((q, qIndex) => (
        <View key={qIndex} style={styles.questionBlock}>
            <View style={styles.rowBetween}>
            <Text style={styles.questionTitle}>Câu {qIndex + 1}</Text>
            {questions.length > 1 && (
                <TouchableOpacity onPress={() => {
                const updated = [...questions];
                updated.splice(qIndex, 1);
                setQuestions(updated);
                }}>
                    <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
            )}
            </View>

            <TextInput
            style={styles.input}
            placeholder="Nội dung câu hỏi"
            value={q.text}
            onChangeText={(value) => handleChangeQuestionText(qIndex, value)}
            />
            <View style={styles.radioGroup}>
            <Text style={styles.radioLabel}>Loại câu hỏi:</Text>
            <View style={styles.radioOptions}>
                <TouchableOpacity
                style={styles.radioOption}
                onPress={() => handleChangeQuestionType(qIndex, 'single')}
                >
                <RadioButton
                    value="single"
                    status={q.type === 'single' ? 'checked' : 'unchecked'}
                    onPress={() => handleChangeQuestionType(qIndex, 'single')}
                />
                <Text>Chọn 1 câu trả lời</Text>
                </TouchableOpacity>

                <TouchableOpacity
                style={styles.radioOption}
                onPress={() => handleChangeQuestionType(qIndex, 'multiple')}
                >
                <RadioButton
                    value="multiple"
                    status={q.type === 'multiple' ? 'checked' : 'unchecked'}
                    onPress={() => handleChangeQuestionType(qIndex, 'multiple')}
                />
                <Text>Chọn nhiều câu trả lời</Text>
                </TouchableOpacity>
            </View>
            </View>
            {q.choices.map((c, cIndex) => (
            <View key={cIndex} style={styles.rowBetween}>
                <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={`Lựa chọn ${cIndex + 1}`}
                value={c}
                onChangeText={(value) => handleChangeChoice(qIndex, cIndex, value)}
                />
                {q.choices.length > 1 && (
                <TouchableOpacity onPress={() => {
                    const updated = [...questions];
                    updated[qIndex].choices.splice(cIndex, 1);
                    setQuestions(updated);
                }}>
                    <Ionicons style={styles.deleteText} name="close" size={24} color="#333" />
                </TouchableOpacity>
                )}
            </View>
            ))}
            <TouchableOpacity style={styles.smallButton} onPress={() => handleAddChoice(qIndex)}>
            <Text style={styles.buttonText}>Thêm lựa chọn</Text>
            </TouchableOpacity>
        </View>
        ))}

        <TouchableOpacity style={styles.smallButton} onPress={handleAddQuestion}>
        <Text style={styles.buttonText}>Thêm câu hỏi</Text>
        </TouchableOpacity>
        <View style={{ marginVertical: 5 }} />
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Tạo khảo sát</Text>
        </TouchableOpacity>
        </ScrollView>
    </KeyboardAvoidingView>
  );

};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20 
  },
  label: { 
    fontWeight: 'bold', 
    marginTop: 10 
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    height: 45,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
  },
  dateText: {
    color: '#333',
  },
  button: {
  backgroundColor: '#2196F3',
  paddingVertical: 10,
  paddingHorizontal: 15,
  borderRadius: 5,
  alignItems: 'center',
  marginBottom: 10,
},
  smallButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 5,
  },
    buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  questionBlock: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  questionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  radioGroup: {
  marginBottom: 10,
  },
  radioLabel: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  radioOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  deleteText: {
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 18,
  },
});

export default AddSurvey;