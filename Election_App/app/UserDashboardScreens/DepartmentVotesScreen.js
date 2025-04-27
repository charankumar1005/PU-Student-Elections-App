import React from "react";
import { View, Text, StyleSheet, FlatList, Image } from "react-native";
import { Card } from "react-native-paper";

const DepartmentDetails = ({ route }) => {
  const { department, candidates } = route.params;

 const renderCandidate = ({ item }) => (
  <TouchableOpacity onPress={() => navigation.navigate("CandidateDetails", { candidate: item })}>
    <Card style={styles.card}>
      <View style={styles.cardContent}>
        {item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.image} />}
        <View style={styles.textContent}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.voteCount}>Votes: {item.voteCount}</Text>
        </View>
      </View>
    </Card>
  </TouchableOpacity>
);


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Candidates in {department}</Text>
      <FlatList
        data={candidates}
        renderItem={renderCandidate}
        keyExtractor={(item, index) => item.name + index}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  card: {
    marginBottom: 10,
    backgroundColor: "#fff",
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: "bold",
  },
  category: {
    fontSize: 14,
    color: "#666",
  },
  voteCount: {
    fontSize: 16,
    color: "#007AFF",
    marginTop: 4,
  },
});

export default DepartmentDetails;
