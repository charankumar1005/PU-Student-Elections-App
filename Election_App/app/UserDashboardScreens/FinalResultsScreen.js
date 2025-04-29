import React, { useEffect, useState } from 'react';
import { View, ScrollView, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { Card, Text, Title, Paragraph } from 'react-native-paper';
import axios from 'axios';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage'; // import this

const FinalResultsScreen = () => {
  const [results, setResults] = useState([]);
  const [postedAt, setPostedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userDepartment, setUserDepartment] = useState('');

  useEffect(() => {
    fetchUserDetails();
    fetchResults();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const userData = await AsyncStorage.getItem('userDetails');
      if (userData) {
        const parsedData = JSON.parse(userData);
        setUserDepartment(parsedData.department); // assuming your user object has "department" field
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const fetchResults = async () => {
    try {
      const res = await axios.get('http://192.168.151.139:5000/api/results');
      setResults(res.data.data || []);
      setPostedAt(res.data.postedAt || null);
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
  }

  const filteredResults = results.filter(item => item.department === userDepartment);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {postedAt ? (
        <Text style={styles.resultStatus}>
          🟢 Results Declared on {moment(postedAt).format('MMMM Do YYYY, h:mm A')}
        </Text>
      ) : (
        <Text style={[styles.resultStatus, { color: 'red' }]}>
          🔴 Results Not Declared Yet
        </Text>
      )}

      {filteredResults.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>📭 No results for your department yet.</Text>
        </View>
      ) : (
        filteredResults.map((item, index) => (
          <Card key={index} style={styles.card} mode="elevated">
            <Card.Content style={styles.cardContent}>
              <View style={styles.row}>
                <View style={styles.imageWrapper}>
                <Image
  source={{
    uri: item.candidateImage
      ? `http://192.168.151.139:5000/${item.candidateImage}`
      : 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png',
  }}
  style={styles.candidateImage}
/>


                  {item.voteCount > 0 && (
                    <View style={styles.winnerSticker}>
                      <Text style={styles.winnerText}>🏆</Text>
                    </View>
                  )}
                </View>
                <View style={styles.textWrapper}>
                  <Title style={styles.candidateName}>{item.candidateName}</Title>
                  <Paragraph style={styles.category}>{item.category}</Paragraph>
                  <Paragraph style={styles.department}>Department: {item.department}</Paragraph>
                  <Paragraph style={styles.voteCount}>Total Votes: {item.voteCount}</Paragraph>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 30,
    backgroundColor: '#f6f8fa',
  },
  resultStatus: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    color: 'green',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  cardContent: {
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  candidateImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  winnerSticker: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 12,
    elevation: 3,
  },
  winnerText: {
    fontSize: 18,
    color: '#FFD700',
  },
  textWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  candidateName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  department: {
    fontSize: 14,
    color: '#555',
    marginTop: 1,
  },
  voteCount: {
    fontSize: 14,
    color: '#222',
    marginTop: 1,
    fontWeight: '600',
  },
});

export default FinalResultsScreen;
