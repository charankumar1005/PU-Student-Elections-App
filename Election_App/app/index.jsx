import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, TouchableWithoutFeedback } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const toggleMenu = () => {
    if (menuVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setMenuVisible(false));
    } else {
      setMenuVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => menuVisible && toggleMenu()}>
      <View style={styles.container}>
        {/* Header with Menu Button */}
        <View style={styles.header}>
          <Text style={styles.headerText}>PU-Elections</Text>
          <TouchableOpacity onPress={toggleMenu}>
            <Ionicons name="menu" size={30} color="white" />
          </TouchableOpacity>
        </View>

        {/* Animated Dropdown Menu */}
        {menuVisible && (
          <Animated.View style={[styles.dropdownMenu, {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }]}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                toggleMenu();
                router.push("/UserDashboardScreens/Instructions");
              }}
            >
              <Ionicons name="information-circle" size={20} color="#1a237e" />
              <Text style={styles.menuText}>Voting Guide</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Main Content */}
        <View style={styles.content}>
        
           <Image source={require("../assets/images/landing-bg.jpg")} style={styles.logo}  resizeMode="contain" />
           
           
          <Text style={styles.title}>Pondicherry University</Text>
          <Text style={styles.subtitle}>Student Council Elections 2023</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => router.push("/UserDashboardScreens/login")}
            >
              <Text style={styles.buttonText}>Student Login</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.registerButton]} 
              onPress={() => router.push("/UserDashboardScreens/register")}
            >
              <Text style={styles.buttonText}>New Registration</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>
            Exercise your democratic right!{"\n"}
            Voting Period: Yet To Be Updated
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9ff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a237e",
    padding: 20,
    paddingTop: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  dropdownMenu: {
    position: "absolute",
    top: 80,
    right: 20,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 10,
    width: 180,
    zIndex: 100,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#1a237e",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 25,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1a237e",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#283593",
    textAlign: "center",
    marginBottom: 35,
    fontWeight: "500",
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 400,
  },
  button: {
    backgroundColor: "#1a237e",
    padding: 16,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  registerButton: {
    backgroundColor: "#d32f2f",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  footerText: {
    position: "absolute",
    bottom: 30,
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    lineHeight: 20,
  },
});