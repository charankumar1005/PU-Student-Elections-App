import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Card, Title, Paragraph, Surface } from "react-native-paper";
import { schoolsAndDepartments } from "../data/data";
import { BarChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;

const VotesByDepartment = () => {
  const [votesData, setVotesData] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchVotes = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch("http://192.168.151.139:5000/api/votes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await response.json();

      if (json.success) {
        setVotesData(json.data);
      }
    } catch (err) {
      console.error("Error fetching votes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVotes();
  }, []);

  const renderCandidate = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.cardContent}>
        <Image source={{ uri: `http://192.168.151.139:5000/${item.imageUrl}` }} style={styles.image} />
        <View style={styles.textContent}>
          <Title style={styles.name}>{item.name}</Title>
          <Paragraph style={styles.category}>{item.category}</Paragraph>
          <Text style={styles.voteCount}>🗳️ {item.voteCount} votes</Text>
        </View>
      </View>
    </Card>
  );

  const getCandidatesByDepartment = (department) => {
    return votesData
      .filter((v) => v.department === department)
      .map((v) => ({
        name: v.candidate?.name || "N/A",
        department: v.department,
        gender: v.candidate?.gender || "N/A",
        age: v.candidate?.age || "N/A",
        category: v.candidate?.category || "N/A",
        programName: v.candidate?.programName || "N/A",
        voteCount: v.voteCount || 0,
        imageUrl: v.candidate?.image,
      }));
  };

  const renderVoteChart = (candidates) => {
    const labels = candidates.map((c) => c.name.length > 5 ? c.name.substring(0, 5) + ".." : c.name);
    const data = candidates.map((c) => c.voteCount);

    return (
      <BarChart
        data={{
          labels,
          datasets: [
            {
              data,
            },
          ],
        }}
        width={screenWidth - 32}
        height={220}
        yAxisLabel=""
        chartConfig={{
          backgroundColor: "#f0f4f8",
          backgroundGradientFrom: "#E3F2FD",
          backgroundGradientTo: "#90CAF9",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: "6",
            strokeWidth: "2",
            stroke: "#007AFF",
          },
        }}
        verticalLabelRotation={30}
        style={{ marginTop: 10, borderRadius: 16 }}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📊 Votes by Department</Text>
      {schoolsAndDepartments.map((school, idx) => (
        <View key={idx}>
          <Text style={styles.schoolTitle}>{school.name}</Text>
          {school.departments.map((dept, deptIdx) => (
            <TouchableOpacity
              key={deptIdx}
              style={[
                styles.departmentButton,
                selectedDepartment === dept && styles.selectedDept,
              ]}
              onPress={() =>
                setSelectedDepartment(
                  selectedDepartment === dept ? null : dept
                )
              }
            >
              <Text style={styles.departmentText}>{dept}</Text>
            </TouchableOpacity>
          ))}

          {selectedDepartment &&
            school.departments.includes(selectedDepartment) && (
              <>
                {renderVoteChart(getCandidatesByDepartment(selectedDepartment))}
                <FlatList
                  data={getCandidatesByDepartment(selectedDepartment)}
                  renderItem={renderCandidate}
                  keyExtractor={(item, index) => item.name + index}
                  style={styles.candidateList}
                />
              </>
            )}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 60,
    backgroundColor: "#f0f4f8",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  schoolTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
    color: "#222",
  },
  departmentButton: {
    padding: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 10,
    marginVertical: 6,
    elevation: 1,
  },
  selectedDept: {
    backgroundColor: "#90CAF9",
  },
  departmentText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    marginVertical: 10,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: "#eee",
  },
  textContent: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  category: {
    fontSize: 14,
    color: "#666",
  },
  voteCount: {
    fontSize: 16,
    color: "#1E88E5",
    marginTop: 4,
  },
  candidateList: {
    marginTop: 10,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default VotesByDepartment;