import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Image,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NominationStatus = () => {
  const [nomination, setNomination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNominationStatus = async () => {
    setRefreshing(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get('http://192.168.151.139:5000/api/nominations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const [latest] = response.data.data;
      setNomination(latest || null);
    } catch (error) {
      console.error('❌ Fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNominationStatus();
  }, []);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      default:
        return '#ff9800';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} color="#007AFF" />;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={fetchNominationStatus} />
      }
    >
      {nomination ? (
        <View style={styles.card}>
          {/* Image */}
          {nomination?.candidate?.image ? (
            <Image
              source={{ uri: nomination.candidate.image }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.noImageBox}>
              <Text style={styles.noImageText}>No Image Available</Text>
            </View>
          )}

          {/* Details */}
          <View style={styles.detailBox}>
            <Text style={styles.title}>{nomination?.candidate?.name || 'N/A'}</Text>
            <Text style={styles.subtitle}>{nomination?.candidate?.department || 'N/A'}</Text>
          </View>

          {/* Status */}
          <View
            style={[
              styles.statusBox,
              { backgroundColor: getStatusColor(nomination.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusText(nomination.status)}</Text>
          </View>

          {/* Submitted Date */}
          <Text style={styles.dateText}>
            Submitted On:{' '}
            <Text style={{ fontWeight: '600', color: '#000' }}>
              {new Date(nomination.createdAt).toLocaleString()}
            </Text>
          </Text>
        </View>
      ) : (
        <Text style={styles.noNomination}>No active nomination found.</Text>
      )}
    </ScrollView>
  );
};

export default NominationStatus;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f7fa',
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 25,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  image: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: '#ccc',
    marginBottom: 15,
  },
  noImageBox: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#eee',
  },
  noImageText: {
    color: '#888',
    fontSize: 14,
  },
  detailBox: {
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statusBox: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginVertical: 15,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 15,
    color: '#444',
    marginTop: 10,
  },
  noNomination: {
    fontSize: 16,
    textAlign: 'center',
    color: '#888',
  },
});
