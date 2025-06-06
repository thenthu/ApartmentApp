import { useEffect, useState,  useContext, } from 'react';
import { View, Text, FlatList, StyleSheet, Button, TextInput, Alert } from 'react-native';
import { ActivityIndicator, Card, Checkbox, RadioButton } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { authApis, endpoints } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MyDispatchContext, MyUserContext } from "../../configs/Contexts";

const DoSurvey = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { surveyId } = route.params;

  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState({});
  const user = useContext(MyUserContext);
  const residentId = user.resident.id;

  useEffect(() => {
    const loadSurvey = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await authApis(token).get(`${endpoints.surveys}${surveyId}/`);
        setSurvey(res.data);
      } catch (err) {
        console.error(err);
        setError('Không thể tải khảo sát.');
      } finally {
        setLoading(false);
      }
    };

    loadSurvey();
  }, [surveyId]);

  const handleAnswerChange = (questionId, answer) => {
    if (Array.isArray(answer)) {
        setAnswers((prevAnswers) => ({
        ...prevAnswers,
        [questionId]: answer,
        }));
    } else {
        setAnswers((prevAnswers) => ({
        ...prevAnswers,
        [questionId]: answer,
        }));
    }
  };

  const handleSubmitSurvey = async () => {
    if (Object.keys(answers).length !== survey.questions.length) {
      Alert.alert('Chưa trả lời đầy đủ', 'Vui lòng trả lời tất cả các câu hỏi trước khi gửi.');
      return;
    }

    const payload = {
      survey: surveyId,
      answers: Object.keys(answers).map((questionId) => {
        const question = survey.questions.find(q => q.id === parseInt(questionId));
        
        return {
          question: question.id,
          choices: question.type === 'multiple'
            ? answers[questionId]
            : [answers[questionId]],
        };
      }),
    };
    console.log(JSON.stringify(payload, null, 2));

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await authApis(token).post(`/residents/${residentId}/surveys/${surveyId}/responses/`, payload);

    //   if (response.status === 200) {
    //     Alert.alert('Gửi khảo sát thành công', 'Cảm ơn bạn đã tham gia khảo sát!');
    //     navigation.goBack();
    //   } else {
    //     Alert.alert('Lỗi', 'Đã có lỗi xảy ra khi gửi khảo sát.');
    //   }
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể gửi khảo sát. Vui lòng thử lại.');
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 30 }} />;

  if (error) return (
    <View style={{ padding: 20 }}>
      <Text>{error}</Text>
    </View>
  );

  if (!survey) return null;

  const renderQuestionItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.questionText}>{item.text}</Text>

        {item.type === 'multiple' && item.choices.map((choice, index) => (
          <View key={index} style={styles.choiceContainer}>
            <Checkbox
              status={answers[item.id]?.includes(choice.id) ? 'checked' : 'unchecked'}
              onPress={() => {
                const currentAnswers = answers[item.id] || [];
                const newAnswers = currentAnswers.includes(choice.id)
                  ? currentAnswers.filter(id => id !== choice.id)
                  : [...currentAnswers, choice.id];
                handleAnswerChange(item.id, newAnswers);
              }}
            />
            <Text>{choice.text}</Text>
          </View>
        ))}

        {item.type === 'single' && item.choices.map((choice, index) => (
          <View key={index} style={styles.choiceContainer}>
            <RadioButton
              value={choice.id}
              status={answers[item.id] === choice.id ? 'checked' : 'unchecked'}
              onPress={() => handleAnswerChange(item.id, choice.id)}
            />
            <Text>{choice.text}</Text>
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{survey.title}</Text>
      <Text style={styles.description}>{survey.description || 'Không có mô tả'}</Text>
      <Text style={styles.date}>
        Hạn chót: {new Date(survey.deadline).toLocaleDateString('vi-VN')}
      </Text>

      <FlatList
        data={survey.questions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderQuestionItem}
      />

      <Button title="Gửi câu trả lời" onPress={handleSubmitSurvey} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  description: {
    marginTop: 10,
    fontSize: 16,
    color: '#444',
  },
  date: {
    marginTop: 10,
    fontSize: 14,
    color: 'gray',
  },
  card: {
    marginVertical: 10,
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  choiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 10,
    paddingLeft: 8,
  },
});

export default DoSurvey;
