import React from "react";
import { View, Text, StyleSheet, ScrollView,TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function InstructionsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voting Instructions</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Election Process Guide</Text>
        
        <View style={styles.step}>
          <Ionicons name="person-check" size={20} color="#1e88e5" />
          <Text style={styles.stepText}>
            Ensure you're a registered student with valid university credentials
          </Text>
        </View>

        <View style={styles.step}>
          <Ionicons name="time" size={20} color="#1e88e5" />
          <Text style={styles.stepText}>
            Voting will be open from 9:00 AM to 5:00 PM .
          </Text>
        </View>

        <View style={styles.step}>
          <Ionicons name="lock-closed" size={20} color="#1e88e5" />
          <Text style={styles.stepText}>
            Your vote is confidential and securely encrypted
          </Text>
        </View>

        <Text style={styles.subTitle}>Voting Steps:</Text>
        <View style={styles.numberedStep}>
          <Text style={styles.number}>1.</Text>
          <Text style={styles.stepText}>Login with your university credentials</Text>
        </View>
        <View style={styles.numberedStep}>
          <Text style={styles.number}>2.</Text>
          <Text style={styles.stepText}>Verify your identity through OTP</Text>
        </View>
        <View style={styles.numberedStep}>
          <Text style={styles.number}>3.</Text>
          <Text style={styles.stepText}>Select your preferred candidates</Text>
        </View>
        <View style={styles.numberedStep}>
          <Text style={styles.number}>4.</Text>
          <Text style={styles.stepText}>Review and submit your ballot</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4ff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a237e",
    padding: 15,
    paddingTop: 40,
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    marginLeft: 15,
    fontWeight: "bold",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a237e",
    marginBottom: 20,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a237e",
    marginVertical: 15,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#e8f4ff",
    padding: 15,
    borderRadius: 10,
  },
  numberedStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 10,
  },
  number: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a237e",
    marginRight: 10,
  },
  stepText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
});