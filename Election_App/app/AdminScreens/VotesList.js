// app/(admin)/votes-by-department.jsx

import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const VotesByDepartmentScreen = () => {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVotes = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await axios.get("http://http://192.168.98.139:5000/api/vote/by-department", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setVotes(response.data.data);
    } catch (err) {
      console.error("Vote fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVotes();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#6200ee" style={{ marginTop: 50 }} />;
  }

  return (
    <ScrollView style={{ padding: 16, backgroundColor: "#f8f9fa" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>🗳️ Votes by Department</Text>

      {votes.map((dept, index) => (
        <View
          key={index}
          style={{
            backgroundColor: "#fff",
            marginBottom: 20,
            padding: 16,
            borderRadius: 12,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 10 }}>
            {dept.department}
          </Text>
          {dept.candidates.map((candidate, idx) => (
            <View key={idx} style={{ marginBottom: 8, paddingLeft: 10 }}>
              <Text style={{ fontSize: 16, color: "#444" }}>
                • {candidate.name} — <Text style={{ fontWeight: "bold" }}>{candidate.count} votes</Text>
              </Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

export default VotesByDepartmentScreen;
