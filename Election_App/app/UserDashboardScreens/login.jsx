import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [saveDetails, setSaveDetails] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        const userData = await AsyncStorage.getItem("userDetails");
        const user = JSON.parse(userData);
        if (user?.isAdmin) {
          router.replace("/AdminScreens/AdminDashboard");
        } else {
          router.replace("/UserDashboardScreens/DashboardScreen");
        }
      }

      const savedDetails = await AsyncStorage.getItem("savedLoginDetails");
      if (savedDetails) {
        const { email: savedEmail, password: savedPassword } = JSON.parse(savedDetails);
        setEmail(savedEmail);
        setPassword(savedPassword);
        setSaveDetails(true);
      }
    };
    checkLoginStatus();
  }, []);

  const handleLogin = async () => {
    setError("");
    try {
      const response = await fetch("http://192.168.151.139:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (response.ok) {
        const { token, user } = data;
        await AsyncStorage.setItem("userToken", token);
        await AsyncStorage.setItem("userDetails", JSON.stringify(user));
        await AsyncStorage.setItem("userId", user.id);

        if (saveDetails) {
          await AsyncStorage.setItem("savedLoginDetails", JSON.stringify({ email, password }));
        } else {
          await AsyncStorage.removeItem("savedLoginDetails");
        }

        if (user?.isAdmin) {
          console.log("✅ Admin login successful");
          router.replace("/AdminScreens/AdminDashboard");
        } else {
          console.log("✅ User login successful");
          router.replace("/UserDashboardScreens/DashboardScreen");
        }
      } else {
        Alert.alert("Login Error", data.message || "Invalid email or password");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      Alert.alert("Error", "Network error, please try again later.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        onChangeText={setEmail}
        value={email}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          secureTextEntry={!showPassword}
          onChangeText={setPassword}
          value={password}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="gray" />
        </TouchableOpacity>
      </View>

      <View style={styles.saveDetailsContainer}>
        <TouchableOpacity onPress={() => setSaveDetails(!saveDetails)} style={styles.saveDetailsCheckbox}>
          {saveDetails ? (
            <Ionicons name="checkbox" size={24} color="#007bff" />
          ) : (
            <Ionicons name="square" size={24} color="#ccc" />
          )}
        </TouchableOpacity>
        <Text style={styles.saveDetailsText}>Save Login Details</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/UserDashboardScreens/register")}>
        <Text style={styles.linkText}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  input: {
    width: "80%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    marginVertical: 8,
    borderRadius: 8,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "80%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginVertical: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
  },
  eyeIcon: {
    padding: 10,
  },
  saveDetailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  saveDetailsCheckbox: {
    padding: 10,
  },
  saveDetailsText: {
    marginLeft: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkText: {
    color: "#007bff",
    marginTop: 10,
  },
});

// export default LoginScreen;
