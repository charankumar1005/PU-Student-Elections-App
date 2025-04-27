import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

const CandidateDetails = ({ route }) => {
  const { candidate } = route.params;

  return (
    <View style={styles.container}>
      {candidate.imageUrl && <Image source={{ uri: candidate.imageUrl }} style={styles.image} />}
      <Text style={styles.name}>{candidate.name}</Text>
      <Text>Category: {candidate.category}</Text>
      <Text>Age: {candidate.age}</Text>
      <Text>Gender: {candidate.gender}</Text>
      <Text>Program: {candidate.programName}</Text>
      <Text>Votes: {candidate.voteCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flex: 1,
    alignItems: "center",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
});

export default CandidateDetails;
