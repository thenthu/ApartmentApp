import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';
import { authApis, endpoints } from '../../configs/Apis';
import { PieChart } from 'react-native-chart-kit';
import { Card } from 'react-native-paper';

const SurveyDetail = () => {
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [showStatistics, setShowStatistics] = useState(false);
  const route = useRoute();
  const { surveyId } = route.params;

  const loadSurvey = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const surveyRes = await authApis(token).get(`${endpoints.surveys}${surveyId}/`);
      setSurvey(surveyRes.data);

      const res = await authApis(token).get(`${endpoints.surveys}${surveyId}/responses/`);
      setResponses(res.data);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu khảo sát:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu khảo sát hoặc câu trả lời.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurvey();
  }, []);

  const getAnswersForQuestion = (questionText) => {
    let answersByResident = {};
    responses.forEach(response => {
      response.answers.forEach(answer => {
        if (answer.question === questionText) {
          const residentName = response.user || "Cư dân không xác định";
          if (!answersByResident[residentName]) {
            answersByResident[residentName] = [];
          }
          answersByResident[residentName] = [
            ...answersByResident[residentName],
            ...answer.choices.map(choice => choice.text)
          ];
        }
      });
    });
    return answersByResident;
  };

  const getStatisticsForQuestion = (questionText) => {
    const answerCounts = {};
    const colors = ['#FF6347', '#2E8B57', '#FFD700', '#8A2BE2', '#FF4500', '#20B2AA'];
    let totalChoices = 0;

    responses.forEach(response => {
      response.answers.forEach(answer => {
        if (answer.question === questionText) {
          answer.choices.forEach(choice => {
            answerCounts[choice.text] = (answerCounts[choice.text] || 0) + 1;
            totalChoices += 1;
          });
        }
      });
    });

    const statistics = [];
    let colorIndex = 0;

    for (let answer in answerCounts) {
      const percentage = ((answerCounts[answer] / totalChoices) * 100).toFixed(2);
      statistics.push({
        name: answer,
        population: parseFloat(percentage),
        color: colors[colorIndex % colors.length],
        legendFontColor: '#000',
        legendFontSize: 12,
      });
      colorIndex++;
    }

    return statistics;
  };

  const toggleAnswerSection = (questionText) => {
    setExpandedQuestion(expandedQuestion === questionText ? null : questionText);
  };

  const toggleStatistics = () => {
    setShowStatistics(!showStatistics);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Đang tải chi tiết khảo sát...</Text>
      </View>
    );
  }

  if (!survey) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Không tìm thấy khảo sát.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollViewContent}>
      <Text style={styles.title}>{survey.title}</Text>
      <Text style={styles.description}>{survey.description}</Text>
      <Text style={styles.deadline}>Hạn chót: {new Date(survey.deadline).toLocaleDateString()}</Text>

      {survey.questions.map((q, index) => (
        <Card key={q.id || index} style={styles.questionCard}>
          <Card.Content>
            <Text style={styles.questionText}>Câu {index + 1}: {q.text}</Text>
            <Text style={styles.typeText}>
              Loại: {q.type === 'single' ? 'Chọn một' : 'Chọn nhiều'}
            </Text>

            {q.choices.map((choice, cIndex) => (
              <Text key={cIndex} style={styles.choiceText}>- {choice.text}</Text>
            ))}

            <TouchableOpacity
              onPress={() => toggleAnswerSection(q.text)}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleButtonText}>
                {expandedQuestion === q.text ? 'Ẩn câu trả lời' : 'Xem câu trả lời'}
              </Text>
            </TouchableOpacity>

            {expandedQuestion === q.text && (
              <View style={styles.responseSection}>
                <Text style={styles.responseHeader}>Câu trả lời từ cư dân:</Text>
                {Object.keys(getAnswersForQuestion(q.text)).length === 0 ? (
                  <Text style={styles.noResponse}>Chưa có câu trả lời.</Text>
                ) : (
                  Object.keys(getAnswersForQuestion(q.text)).map((residentName, i) => (
                    <View key={i} style={styles.residentAnswerBlock}>
                      <Text style={styles.residentName}>{residentName}</Text>
                      {getAnswersForQuestion(q.text)[residentName].map((answer, j) => (
                        <Text key={j} style={styles.responseText}>- {answer}</Text>
                      ))}
                    </View>
                  ))
                ) }
              </View>
            )}
          </Card.Content>
        </Card>
      ))}

      <TouchableOpacity
        onPress={toggleStatistics}
        style={styles.toggleButton}
      >
        <Text style={styles.toggleButtonText}>
          {showStatistics ? 'Ẩn thống kê' : 'Xem thống kê câu trả lời'}
        </Text>
      </TouchableOpacity>

      {showStatistics && (
        <View style={styles.statisticsSection}>
            {survey.questions.map((q, index) => {
            const statistics = getStatisticsForQuestion(q.text);
            return (
                <View key={q.id || index}>
                {statistics.length > 0 ? (
                    <View style={{ marginBottom: 20 }}>
                    <Text style={styles.questionsHeader}>Thống kê câu {index + 1}:</Text>
                    <PieChart
                        data={statistics}
                        width={350}
                        height={250}
                        chartConfig={{
                        backgroundColor: '#ffffff',
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 2,
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        style: { borderRadius: 16 },
                        }}
                        accessor="population"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        hasLegend={false}
                    />

                    <View style={styles.legendContainer}>
                        {statistics.map((entry, i) => (
                        <View key={i} style={styles.legendItem}>
                            <View style={[styles.legendColorBox, { backgroundColor: entry.color }]} />
                            <Text style={styles.legendText}>{entry.name}: {entry.population}%</Text>
                        </View>
                        ))}
                    </View>
                    </View>
                ) : (
                    <Text style={styles.noResponse}>Chưa có câu trả lời.</Text>
                )}
                </View>
            );
            })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#7f8c8d' },
  errorText: { fontSize: 16, color: 'red' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#2c3e50' },
  description: { fontSize: 16, marginBottom: 10, color: '#34495e' },
  deadline: { fontSize: 14, fontStyle: 'italic', marginBottom: 20, color: '#7f8c8d' },
  questionCard: {
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#fefefe',
    elevation: 3,
  },
  questionText: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, color: '#2c3e50' },
  typeText: { fontSize: 14, fontStyle: 'italic', marginBottom: 5, color: '#7f8c8d' },
  choiceText: { fontSize: 14, color: '#2c3e50' },
  toggleButton: {
    marginTop: 10,
    backgroundColor: '#2980b9',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  responseSection: { marginTop: 10 },
  responseHeader: { fontWeight: 'bold', color: '#2980b9', marginBottom: 5 },
  noResponse: { fontStyle: 'italic', color: '#95a5a6' },
  residentName: { fontWeight: 'bold', marginTop: 5, color: '#34495e' },
  responseText: { fontSize: 14, color: '#2c3e50' },
  statisticsSection: { marginTop: 10 },
  questionsHeader: { fontWeight: 'bold', color: '#2980b9', marginBottom: 5 },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  legendColorBox: {
    width: 14,
    height: 14,
    marginRight: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 13,
    color: '#2c3e50',
  },
});

export default SurveyDetail;
