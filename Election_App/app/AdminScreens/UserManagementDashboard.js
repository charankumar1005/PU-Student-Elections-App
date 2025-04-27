import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Title,
  Paragraph,
  ActivityIndicator,
  Snackbar,
  Divider,
  useTheme,
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';

const AdminUsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [page, setPage] = useState(1);
  const theme = useTheme();

  useEffect(() => {
    fetchUsers(page);
    const socket = io('http://192.168.151.139:5000'); // Socket.IO backend
    socket.on('users-updated', (data) => {
      fetchUsers(page); // Refetch users
    });

    return () => socket.disconnect();
  }, [page]);

  const fetchUsers = async (pageNumber) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`http://192.168.151.139:5000/api/users?page=${pageNumber}&limit=20`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(response.data.users);
      setDepartments(response.data.departments);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('User fetch error:', error);
      setSnackbarMessage('Failed to load users');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              await axios.delete(`http://192.168.151.139:5000/api/admin/users/${userId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              setSnackbarMessage('User deleted successfully');
              setSnackbarVisible(true);
              fetchUsers(page); // Refresh list
            } catch (error) {
              console.error('Delete error:', error);
              setSnackbarMessage('Failed to delete user');
              setSnackbarVisible(true);
            }
          },
        },
      ]
    );
  };

  const renderUserCard = ({ item }) => (
    <Card style={styles.card} mode="outlined">
      <Card.Content>
        <Title>{item.name}</Title>
        <Paragraph>Email: {item.email}</Paragraph>
        <Paragraph>Dept: {item.department}</Paragraph>
        <Paragraph>Role: {item.role}</Paragraph>
      </Card.Content>
      <Card.Actions style={styles.actions}>
        <Button
          mode="contained"
          buttonColor={theme.colors.error}
          textColor="#fff"
          onPress={() => handleDeleteUser(item._id)}
        >
          Delete
        </Button>
      </Card.Actions>
    </Card>
  );

  const renderDepartmentSection = () => (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.sectionTitle}>📊 Department Stats</Text>
      {departments.map((dept, index) => (
        <View key={index} style={styles.departmentCard}>
          <Text style={styles.departmentTitle}>{dept.department}</Text>
          <Text>Total Users: {dept.count}</Text>
          {dept.users.slice(0, 3).map((user) => (
            <Text key={user._id} style={styles.smallUser}>
              - {user.name}
            </Text>
          ))}
          <Divider style={{ marginVertical: 8 }} />
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {renderDepartmentSection()}

      <Text style={styles.sectionTitle}>👥 All Users</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={renderUserCard}
        scrollEnabled={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Pagination */}
      <View style={styles.pagination}>
        <Button
          disabled={page <= 1}
          onPress={() => setPage(page - 1)}
        >
          Previous
        </Button>
        <Text>
          Page {pagination.currentPage} of {pagination.totalPages}
        </Text>
        <Button
          disabled={page >= pagination.totalPages}
          onPress={() => setPage(page + 1)}
        >
          Next
        </Button>
      </View>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
};

export default AdminUsersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    marginVertical: 6,
    borderRadius: 10,
    elevation: 4,
  },
  actions: {
    justifyContent: 'flex-end',
    paddingRight: 12,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 12,
    color: '#fff',
  },
  departmentCard: {
    backgroundColor: '#1f1f1f',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  departmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#90caf9',
  },
  smallUser: {
    fontSize: 13,
    color: '#ccc',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
});
