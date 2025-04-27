import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
  SectionList,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import universityLogo from "../../assets/images/landing-bg.jpg";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BarChart } from "react-native-chart-kit";
import { Overlay } from 'react-native-elements';
import io from "socket.io-client";
import { BackHandler } from 'react-native';




const socket = io("http://192.168.151.139:5000");

const AdminDashboard = () => {
  const router = useRouter();
  const [adminDetails, setAdminDetails] = useState({ fullName: '',
  email: '',});
  const [sections, setSections] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showUsersData, setShowUsersData] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [showVotes, setShowVotes] = useState(false);
  const [results, setResults] = useState([]);
const [showProfile, setShowProfile] = useState(false);
const [selectedUserId, setSelectedUserId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState({
    users: false,
    notifications: false,
    deleting: false,
  });
  
  const [newNotification, setNewNotification] = useState({
    title: "",
    content: "",
  });

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{ data: [] }]
  });

  const profileAnimation = useRef(new Animated.Value(1)).current;
  const usersAnimation = useRef(new Animated.Value(1)).current;
  const chartAnimation = useRef(new Animated.Value(1)).current;
  const menuAnimation = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    socket.on("resultsPosted", () => {
      fetchResults();
    });

    return () => socket.off("resultsPosted");
  }, []);
// new
 useEffect(() => {
    socket.on("user-deleted", ({ userId }) => {
      setSections(prev => 
        prev.map(section => ({
          ...section,
          data: section.data.filter(user => user._id !== userId)
        }))
      );
    });
      return () => socket.off("user-deleted");
  }, []);
  useEffect(() => {
    Animated.timing(menuAnimation, {
      toValue: menuVisible ? 0 : -300,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [menuVisible]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          router.replace("/UserDashboardScreens/login");
          return;
        }

        await Promise.all([
          fetchAdminDetails(token),
          fetchUsersData(token),
          fetchResults(),
        ]);

      } catch (error) {
        handleError("Failed to load initial data", error);
      }
    };

    fetchInitialData();

    return () => {
      socket.off("error");
    };
  }, []);

  const fetchAdminDetails = async (token) => {
  try {
    const response = await fetch("http://192.168.151.139:5000/api/profile", {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch admin details');
    }

    const data = await response.json();
    console.log('Received admin data:', data); // Debug log
    
    setAdminDetails({
      fullName: data.fullName || 'Administrator',
      email: data.email || 'admin@university.edu',
      profilePhoto: data.profilePhoto || null,
      phone: data.phone || 'Not available',
      createdAt: data.createdAt || new Date().toISOString(),
      lastLogin: data.lastLogin || 'Recently'
    });

  } catch (error) {
    console.error("Profile Error:", error);
    Alert.alert("Connection Error", "Failed to fetch profile details. Check your internet connection.");
  }
};
  // {renderProfileModal()}
// Add this function component
const renderProfileModal = () => (
  <Overlay
    isVisible={showProfile}
    onBackdropPress={() => setShowProfile(false)}
    overlayStyle={styles.profileOverlay}
  >
    <View style={styles.profileContainer}>
      <TouchableOpacity 
        style={styles.closeProfileButton}
        onPress={() => setShowProfile(false)}
      >
        <Ionicons name="close" size={24} color="#666" />
      </TouchableOpacity>

      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {adminDetails?.profilePhoto ? (
            <Image 
              source={{ uri: adminDetails.profilePhoto }}
              style={styles.avatar}
            />
          ) : (
            <Text style={styles.avatarFallback}>
              {adminDetails?.fullName
                ? adminDetails.fullName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                : 'AD'}
            </Text>
          )}
        </View>
        <Text style={styles.profileName}>
          {adminDetails?.fullName || 'Administrator'}
        </Text>
        <Text style={styles.profileRole}>System Administrator</Text>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Ionicons name="mail" size={18} color="#6200ea" />
          <Text style={styles.detailText}>
            {adminDetails?.email || 'admin@university.edu'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="call" size={18} color="#6200ea" />
          <Text style={styles.detailText}>
            {adminDetails?.phone || '+91 98765 43210'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="time" size={18} color="#6200ea" />
          <Text style={styles.detailText}>
            Last Login: {adminDetails?.lastLogin || '2 hours ago'}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="shield-checkmark" size={18} color="#6200ea" />
          <Text style={styles.detailText}>
            Admin Since: {adminDetails?.createdAt?.slice(0, 10) || '2023-01-01'}
          </Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        {/* <View style={styles.statItem}>
          <Text style={styles.statNumber}>42</Text>
          <Text style={styles.statLabel}>Actions Today</Text>
        </View> */}
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{sections.length}</Text>
          <Text style={styles.statLabel}>Departments</Text>
        </View>
      </View>
    </View>
  </Overlay>
);
  
   const fetchUsersData = async (token) => {
    try {
      setLoading(prev => ({ ...prev, users: true }));
      const response = await fetch("http://192.168.151.139:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` ,
         'Content-Type': 'application/json'
      }
      });

      if (!response.ok) throw new Error("Failed to fetch users");
      const { departments } = await response.json();
      
      const formattedSections = departments.map(dept => ({
        title: dept.department,
        data: dept.users
      }));
      
      setSections(formattedSections);
      updateChartData(formattedSections);
    } catch (error) {
      handleError("Users Error", error.message);
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  };
// delete user
 const deleteUser = async (userId) => {
    try {
      setLoading(prev => ({ ...prev, deleting: true }));
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch(`http://192.168.151.139:5000/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      setSections(prev => 
        prev.map(section => ({
          ...section,
          data: section.data.filter(user => user._id !== userId)
        }))
      );
      
      Alert.alert("Success", "User deleted successfully");
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(prev => ({ ...prev, deleting: false }));
      setShowDeleteModal(false);
    }
  };
   const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View style={styles.userInfo}>
        {item.profilePhoto ? (
          <Image source={{ uri: item.profilePhoto }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>
              {item.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.fullName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userMeta}>
            {item.studentId} • {item.department}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          setSelectedUserId(item._id);
          setShowDeleteModal(true);
        }}
      >
        <Ionicons name="trash" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
   const renderDeleteModal = () => (
    <Overlay
      isVisible={showDeleteModal}
      onBackdropPress={() => setShowDeleteModal(false)}
      overlayStyle={styles.deleteModalOverlay}
    >
      <View style={styles.deleteModalContent}>
        <Text style={styles.deleteModalTitle}>Confirm Deletion</Text>
        <Text style={styles.deleteModalText}>
          Are you sure you want to delete this user? This action cannot be undone.
        </Text>
        <View style={styles.deleteModalButtons}>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancelButton]}
            onPress={() => setShowDeleteModal(false)}
          >
            <Text style={styles.modalButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.deleteConfirmButton]}
            onPress={() => deleteUser(selectedUserId)}
            disabled={loading.deleting}
          >
            {loading.deleting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.modalButtonText}>Delete</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Overlay>
  );
  const fetchResults = async () => {
    try {
      const res = await fetch("http://192.168.151.139:5000/api/results");
      const json = await res.json();
      if (json.success) setResults(json.data);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to fetch results");
    }
  };

 const updateChartData = (usersData) => {
    const departments = usersData.map(section => ({
      fullName: section.title,
      // Remove "Department of " prefix and get the meaningful name
      shortName: section.title.replace(/^Department of /i, '')
    }));

    setChartData({
      labels: departments.map(d => d.shortName),
      datasets: [{
        data: departments.map(d => d.fullName.split(' ').length), // Example data
        colors: departments.map((_, index) => 
          (opacity = 1) => `hsl(${index * 360 / departments.length}, 70%, 50%)`
        )
      }],
      departments
    });
  };
   const ChartLegend = ({ departments }) => (
    <View style={styles.legendContainer}>
      {departments.map((dept, index) => (
        <View key={index} style={styles.legendItem}>
          <View style={[
            styles.legendColorBox,
            { backgroundColor: `hsl(${index * 360 / departments.length}, 70%, 50%)` }
          ]} />
          <Text style={styles.legendText}>
            {dept.shortName}
          </Text>
        </View>
      ))}
    </View>
  );

const postResults = async () => {
  Alert.alert(
    "Confirm Result Declaration",
    "Are you sure you want to declare the election results? This can only be done once per day.",
    [
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch('http://192.168.151.139:5000/api/results', {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });

            const json = await res.json();
            if (json.success) {
              Alert.alert("Success", "Results Posted Successfully!");
            } else {
              Alert.alert("Notice", json.message || "Failed to post results.");
            }
          } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to post results");
          }
        }
      }
    ]
  );
};


  const handlePostNotification = async () => {
    try {
      setLoading(prev => ({ ...prev, notifications: true }));
      const token = await AsyncStorage.getItem("userToken");
      if (!token) throw new Error("Authentication token not found");

      const response = await fetch("http://192.168.151.139:5000/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newNotification),
      });

      if (!response.ok) throw new Error("Failed to post notification");

      Alert.alert("Success", "Notification posted successfully!");
      setNewNotification({ title: "", content: "" });
      setMenuVisible(false);
      socket.emit("new-notification");
    } catch (error) {
      handleError("Notification Error", error.message);
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }));
    }
  };

  const handleError = (title, message) => {
    Alert.alert(title, message || "An unexpected error occurred");
    console.error(`${title}: ${message}`);
  };

  const animateIcon = (animation) => {
    Animated.spring(animation, {
      toValue: 0.8,
      friction: 7,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(animation, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true,
      }).start();
    });
  };

  
// new

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderTitle}>{section.title}</Text>
    </View>
  );

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userToken");
      router.replace("/UserDashboardScreens/login");
    } catch (error) {
      console.error("Logout Error:", error);
      Alert.alert("Error", "Logout failed");
    }
  };

  const renderMenu = () => (
    <Animated.View 
      style={[
        styles.menuContainer,
        { transform: [{ translateX: menuAnimation }] }
      ]}
    >
      <ScrollView contentContainerStyle={styles.menuContent}>
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>Admin Menu</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setMenuVisible(false)}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={() => router.push("/AdminScreens/DisplyVotes")} 
          style={styles.menuItem}
        >
          <Text style={styles.menuText}>🗳️ View Votes</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => router.push("/AdminScreens/tickets")} 
          style={styles.menuItem}
        >
          <Text style={styles.menuText}>🗳️ View Tickets</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color="#fff" />
          <Text style={styles.menuItemText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={postResults} 
          style={styles.postButton}
        >
          <Text style={styles.postText}>📢 Post Election Results</Text>
        </TouchableOpacity>

        <View style={styles.notificationForm}>
          <Text style={styles.sectionTitle}>Post Notification</Text>
          <TextInput
            style={styles.input}
            placeholder="Title"
            placeholderTextColor="#888"
            value={newNotification.title}
            onChangeText={(text) =>
              setNewNotification({ ...newNotification, title: text })
            }
          />
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Content"
            placeholderTextColor="#888"
            multiline
            value={newNotification.content}
            onChangeText={(text) =>
              setNewNotification({ ...newNotification, content: text })
            }
          />
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handlePostNotification}
          >
            {loading.notifications ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Post Notification</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Animated.View>
  );

   return (
    <View style={styles.container}>
      {renderDeleteModal()}
      {renderMenu()}
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)}>
            <Ionicons name="menu" size={30} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Admin Dashboard</Text>
          <View style={{ width: 30 }} />
        </View>

        <View style={styles.logoContainer}>
          <Image 
            source={universityLogo}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.mainTitle}>Pondicherry University{"\n"}Election Commission</Text>
        </View>
{/* new styles for users */}

        <View style={styles.contentContainer}>
          {showUsersData && (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item._id}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              
              contentContainerStyle={styles.listContent}
            />
          )}

           {showChart && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={{
                labels: chartData.labels,
                datasets: chartData.datasets,
              }}
              width={Dimensions.get('window').width * 2.2}
              height={320}
              chartConfig={{
                backgroundColor: '#1e1e1e',
                backgroundGradientFrom: '#1e1e1e',
                backgroundGradientTo: '#1e1e1e',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: { borderRadius: 16 },
                propsForLabels: {
                  fontSize: 10,
                  rotation: -60,
                  width: 80,
                  y: 12,
                  x: -10
                }
              }}
              verticalLabelRotation={-60}
              style={styles.chart}
              fromZero
              showBarTops={false}
              withCustomBarColorFromData
              flatColor={true}
              showValuesOnTopOfBars={true}
            />
          </ScrollView>
          {chartData.departments && <ChartLegend departments={chartData.departments} />}
        </>
      )}
    </View>

        <View style={styles.bottomNav}>
          <TouchableOpacity
  style={styles.navItem}
  onPress={() => {
    animateIcon(profileAnimation);
    setShowProfile(true);
  }}
>
  <Ionicons name="person" size={24} color="white" />
  <Text style={styles.navText}>Profile</Text>
</TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              animateIcon(usersAnimation);
              setShowUsersData(true);
              setShowChart(false);
            }}
          >
            <Ionicons name="people" size={24} color="white" />
            <Text style={styles.navText}>Users</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => {
              animateIcon(chartAnimation);
              setShowChart(true);
              setShowUsersData(false);
            }}
          >
            <Ionicons name="bar-chart" size={24} color="white" />
            <Text style={styles.navText}>Chart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/AdminScreens/candidates")}
          >
             <Ionicons name="person-add" size={24} color="white" />
            <Text style={styles.navText}>Nominations</Text>
          </TouchableOpacity>
           <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/AdminScreens/ApprovedCandidatesScreen")}
          >
            <Ionicons name="checkmark-circle" size={24} color="white" />
            <Text style={styles.navText}>Approved</Text>
          </TouchableOpacity>
        </View>
      </View>
       {renderProfileModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  deleteModalOverlay: {
    width: '80%',
    borderRadius: 15,
    padding: 20,
  },
  deleteModalContent: {
    alignItems: 'center',
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#e74c3c',
  },
  deleteModalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  deleteConfirmButton: {
    backgroundColor: '#e74c3c',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6200ea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userMeta: {
    fontSize: 12,
    color: '#888',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
   profileOverlay: {
    width: '90%',
    borderRadius: 20,
    padding: 0,
    overflow: 'hidden',
  },
  profileContainer: {
    padding: 25,
  },
  closeProfileButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6200ea20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarFallback: {
    fontSize: 32,
    fontWeight: '600',
    color: '#6200ea',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  profileRole: {
    fontSize: 16,
    color: '#666',
  },
  detailsSection: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  detailText: {
    fontSize: 16,
    color: '#444',
    marginLeft: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6200ea',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 250,
    backgroundColor: '#2c3e50',
    zIndex: 1000,
    elevation: 5,
  },
  menuContent: {
    padding: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#34495e',
  },
  menuTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    backgroundColor: '#34495e',
  },
  menuItemText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 15,
  },
  notificationForm: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#34495e',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#6200ea',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: "#6200ea",
    elevation: 3,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  logoContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 15,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
    lineHeight: 28,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 15,
    marginTop: 10,
  },
  item: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginVertical: 5,
  },
  sectionHeaderTitle: {
    fontWeight: "600",
    fontSize: 16,
    color: "#333",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "#6200ea",
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
 navItem: {
    alignItems: "center",
    paddingHorizontal: 6,
    minWidth: 60,
  },
  navText: {
    color: "white",
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: "#e74c3c",
    padding: 8,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    justifyContent: 'center',
  },
  deleteText: {
    color: "white",
    marginLeft: 8,
    fontSize: 14,
  },
  chart: {
     marginVertical: 15,
    borderRadius: 16,
    paddingRight: 60,
    marginLeft: 30,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 8,
    marginHorizontal: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    elevation: 1,
  },
  legendColorBox: {
    width: 10,
    height: 10,
    marginRight: 4,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 10,
    color: '#333',
  },
  listContent: {
    paddingBottom: 20,
  },
  postButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  postText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AdminDashboard;