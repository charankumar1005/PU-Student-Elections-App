import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { Text, Card, Button } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return handleLogout();

      const response = await fetch("http://192.168.151.139:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) return handleLogout();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications().finally(() => setRefreshing(false));
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      router.replace("/UserDashboardScreens/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>

      {loadingNotifications ? (
        <ActivityIndicator size="large" color="#2c3e50" />
      ) : (
        <FlatList
          data={notifications}
          renderItem={({ item }) => (
            <Card style={styles.card} onPress={() => alert(`Notification: ${item.title}`)}>
              <Card.Title title={item.title} subtitle={new Date(item.createdAt).toLocaleString()} />
              <Card.Content>
                <Text>{item.content}</Text>
              </Card.Content>
            </Card>
          )}
          keyExtractor={(item) => item._id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#2c3e50"]} />
          }
          ListEmptyComponent={<Text style={styles.noNotifications}>No notifications available</Text>}
        />
      )}

      <Button mode="contained" onPress={() => router.push("/UserDashboardScreens/DashboardScreen")} style={styles.backButton}>
        Back to Dashboard
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2c3e50",
  },
  card: {
    marginBottom: 16,
  },
  noNotifications: {
    textAlign: "center",
    color: "#aaa",
    marginTop: 20,
  },
  backButton: {
    marginTop: 20,
  },
});
