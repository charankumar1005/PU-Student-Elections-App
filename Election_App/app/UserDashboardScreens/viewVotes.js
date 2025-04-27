// app/(admin)/votes.jsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Card } from "react-native-paper";

const ViewVotes = () => {
  const [votes, setVotes] = useState([]);

  useEffect(() => {
    const fetchVotes = async () => {
      const token = await AsyncStorage.getItem("userToken");
      const res = await fetch("http://192.168.151.139:5000/api/votes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) setVotes(json.data);
    };

    fetchVotes();
  }, []);

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Image
          source={{ uri: `http://192.168.151.139:5000/${item.candidate.image}` }}
          style={styles.image}
        />
        <View style={styles.info}>
          <Text style={styles.label}>🗳️ Candidate: {item.candidate.name}</Text>
          <Text>📍 Department: {item.candidate.department}</Text>
          <Text>🧑‍💼 Voter: {item.voter.name}</Text>
          <Text>📧 Email: {item.voter.email}</Text>
        </View>
      </View>
    </Card>
  );

  return (
    <FlatList
      data={votes}
      renderItem={renderItem}
      keyExtractor={(item) => item._id}
      contentContainerStyle={{ padding: 10 }}
    />
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: 12, padding: 10, borderRadius: 12 },
  row: { flexDirection: "row", alignItems: "center" },
  image: { width: 60, height: 60, borderRadius: 30, marginRight: 12 },
  info: { flex: 1 },
  label: { fontWeight: "bold", fontSize: 15 },
});

export default ViewVotes;
