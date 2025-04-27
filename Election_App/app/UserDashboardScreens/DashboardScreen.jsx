import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  FlatList, 
  Alert,
  ActivityIndicator,
  AppState,
  BackHandler,
  RefreshControl,
  ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io from "socket.io-client";
import { useFocusEffect, useNavigation } from '@react-navigation/native';

export default function DashboardScreen() {
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const [notifications, setNotifications] = useState([]);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const socketRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const navigation = useNavigation();

  const toggleSidebar = () => {
    if (sidebarVisible) {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setSidebarVisible(false));
    } else {
      setSidebarVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const checkTokenExpiration = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return handleLogout();

      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      if (decodedToken.exp < Date.now() / 1000) {
        Alert.alert("Session Expired", "Please login again");
        handleLogout();
      }
    } catch (error) {
      console.error("Token check error:", error);
      handleLogout();
    }
  };

  const handleLogout = async () => {
    try {
      if (socketRef.current?.connected) {
        socketRef.current.disconnect();
      }
      await AsyncStorage.clear();
      router.replace("/UserDashboardScreens/login");
    } catch (error) {
      console.error("Logout failed:", error);
      Alert.alert("Error", "Logout failed. Please try again.");
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return handleLogout();

      const response = await fetch("http://192.168.151.139:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 401) return handleLogout();
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch error:", error);
      Alert.alert("Error", "Failed to load notifications");
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications().finally(() => setRefreshing(false));
  };

  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextState => {
      if (appState.current.match(/inactive|background/) && nextState === "active") {
        checkTokenExpiration();
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const checkAuth = async () => {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          router.replace("/UserDashboardScreens/login");
        }
      };
      checkAuth();
    }, [])
  );

  useEffect(() => {
    const setupSocket = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) return;

        socketRef.current = io("http://192.168.151.139:3000", {
          auth: { token },
          transports: ['websocket']
        });

        socketRef.current.on("connect_error", (err) => {
          if (err.message.includes("auth")) handleLogout();
        });

        socketRef.current.on("notification", (notification) => {
          setNotifications(prev => [...prev, notification]);
        });
      } catch (error) {
        console.error("Socket error:", error);
      }
    };

    setupSocket();
    return () => socketRef.current?.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(checkTokenExpiration, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (sidebarVisible) {
          toggleSidebar();
          return true;
        }

        if (!navigation.canGoBack()) {
          return true;
        }

        navigation.goBack();
        return true;
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [sidebarVisible])
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleSidebar}>
          <Ionicons name="menu" size={30} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Dashboard</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Overlay */}
      {sidebarVisible && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <Animated.View style={[
        styles.sidebar,
        {
          transform: [{ translateX: slideAnim }],
        }
      ]}>
       <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            router.push("/UserDashboardScreens/notifications");
            toggleSidebar();
          }}
        >
          <Ionicons name="notifications" size={22} color="#2c3e50" />
          <Text style={styles.menuText}>Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            router.push("/UserDashboardScreens/helpdesk");
            toggleSidebar();
          }}
        >
          <Ionicons name="help-circle" size={22} color="#2c3e50" />
          <Text style={styles.menuText}>Help Desk</Text>
        </TouchableOpacity>
        {/* <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            router.push("/UserDashboardScreens/FinalResultsScreen");
            toggleSidebar();
          }}
        >
          <Ionicons name="help-circle" size={22} color="#2c3e50" />
          <Text style={styles.menuText}>Results</Text>
        </TouchableOpacity> */}

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            router.push("/UserDashboardScreens/NominationStatus");
            toggleSidebar();
          }}
        >
         <Ionicons name="document-text" size={22} color="#2c3e50" />
<Text style={styles.menuText}>Nomination Status</Text>

        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            router.push("/UserDashboardScreens/ImageUpload");
            toggleSidebar();
          }}
        >
           <Ionicons name="cloud-upload" size={24} color="#2c3e50" />
          <Text style={styles.menuText}>Add DP</Text>
        </TouchableOpacity>
          <TouchableOpacity
  style={styles.menuItem}
  onPress={() => {
    router.push("/UserDashboardScreens/ContactUs"); // Adjust path based on your file structure
    toggleSidebar(); // Close sidebar after navigation
  }}
>
  <Ionicons name="mail-open" size={22} color="#2c3e50" />
  <Text style={styles.menuText}>Contact Us</Text>
</TouchableOpacity>

        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={22} color="white" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Main Content */}
      {!showAllNotifications ? (
        <ScrollView
          contentContainerStyle={styles.middleContentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#2c3e50"]}
            />
          }
        >
          {/* <Text style={styles.sectionTitle}>Elections</Text>

          <TouchableOpacity
            style={styles.electionCard}
            onPress={() => router.push("#")}
          >
            <Ionicons name="business" size={30} color="white" />
            <Text style={styles.electionText}>Department Elections</Text>
          </TouchableOpacity> */}
<Ionicons name="business" size={30} color="#2c3e50" />
             <Text style={styles.sectionTitle}>department Level Elections</Text>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          {loadingNotifications ? (
            <ActivityIndicator size="large" color="#2c3e50" />
          ) : (
            <>
              {notifications.slice(0, 3).map((item) => (
                <View key={item._id} style={styles.notificationPreview}>
                  <Text style={styles.notificationPreviewTitle}>{item.title}</Text>
                  <Text style={styles.notificationPreviewContent}>
                    {((item.content?.toString() || '').substring(0, 40) + '...')}
                  </Text>
                </View>
              ))}
              {notifications.length === 0 && (
                <Text style={styles.noNotificationsText}>No new notifications</Text>
              )}
            {notifications.length > 3 && (
  <TouchableOpacity
    onPress={() => router.push("/UserDashboardScreens/notifications")}
    style={styles.viewMoreButton}
  >
    <Text style={styles.viewMoreText}>View All Notifications</Text>
  </TouchableOpacity>
)}
            </>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={notifications}
          renderItem={({ item }) => (
            <View style={styles.notification}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationDate}>
                {new Date(item.createdAt || Date.now()).toLocaleString()}
              </Text>
              <Text style={styles.notificationContent}>{item.content?.toString()}</Text>
            </View>
          )}
          keyExtractor={(item) => item._id.toString()}
          contentContainerStyle={{ padding: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#2c3e50"]}
            />
          }
        />
      )}

      {/* Bottom Navigation */}
      {!showAllNotifications && (
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/UserDashboardScreens/ProfileScreen")}
          >
            <Ionicons name="person" size={24} color="white" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/UserDashboardScreens/FinalResultsScreen")}
          >
           <Ionicons name="trophy" size={24} color="white" />
<Text style={styles.navText}>Results</Text>

          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/UserDashboardScreens/nominations")}
          >
            <Ionicons name="clipboard" size={24} color="white" />
            <Text style={styles.navText}>Nominations</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/UserDashboardScreens/vote")}
          >
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <Text style={styles.navText}>Vote</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/UserDashboardScreens/UserApprovedCandidatesScreen")}
          >
            <Ionicons name="list" size={24} color="white" />
            <Text style={styles.navText}>Candidates</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#2c3e50",
    elevation: 5,
    zIndex: 3,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "700",
    color: "white",
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '75%',
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 15,
    marginVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  menuText: {
    marginLeft: 15,
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    width: '80%',
    alignSelf: 'center',
  },
  logoutText: {
    marginLeft: 10,
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  middleContentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 15,
    color: "#333",
  },
  electionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2c3e50",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
  },
  electionText: {
    color: "white",
    fontSize: 18,
    marginLeft: 15,
    fontWeight: "600",
  },
  notificationPreview: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  notificationPreviewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d2d2d",
  },
  notificationPreviewContent: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  viewMoreButton: {
    backgroundColor: "#2c3e50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  viewMoreText: {
    color: "white",
    fontWeight: "500",
  },
  notification: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d2d2d",
  },
  notificationDate: {
    fontSize: 12,
    color: "#666",
    marginVertical: 5,
  },
  notificationContent: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    backgroundColor: "#2c3e50",
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  navItem: {
    alignItems: "center",
    padding: 8,
  },
  navText: {
    color: "white",
    fontSize: 12,
    marginTop: 4,
  },
  noNotificationsText: {
    color: "#666",
    textAlign: "center",
    marginVertical: 20,
    fontSize: 16,
  },
});