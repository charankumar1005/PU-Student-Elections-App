import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const UserApprovedCandidatesScreen = () => {
  const [approvedList, setApprovedList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovedCandidates = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      const response = await fetch(
        "http://192.168.151.139:5000/api/approved-candidates",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const json = await response.json();

      if (!json.success) {
        throw new Error(json.message || "Failed to fetch approved candidates");
      }

      const formatted = json.data.map((n) => ({
        name: n.candidate?.name || "N/A",
        department: n.candidate?.department || "N/A",
        manifesto: n.candidate?.manifesto || "No manifesto provided.",
         gender: n.candidate?.gender || "N/A",
          age: n.candidate?.age || "N/A",
          category: n.candidate?.category || "N/A",
          programName: n.candidate?.programName || "N/A",
        imageUrl: n.candidate?.image
          ? `http://192.168.151.139:5000/${n.candidate.image}`
          : null,
      }));

      setApprovedList(formatted);
    } catch (err) {
      console.error("❌ Error fetching approved candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedCandidates();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}> Your Department's Approved Candidates</Text>

      <FlatList
        data={approvedList}
        keyExtractor={(item, index) => item.name + index}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.image} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Text>No Image</Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.department}>📘 {item.department}</Text>
                <Text style={styles.detail}>Program: {item.programName}</Text>
                                <Text style={styles.detail}>Gender: {item.gender}</Text>
                                <Text style={styles.detail}>Age: {item.age}</Text>
                                <Text style={styles.detail}>Category: {item.category}</Text>
                <Text style={styles.manifestoTitle}>📝 Manifesto:</Text>
                <Text style={styles.manifesto}>{item.manifesto}</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No approved candidates found for your department.</Text>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
};

export default UserApprovedCandidatesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    backgroundColor: "#F4F6F8",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#1E1E1E",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  department: {
    fontSize: 14,
    color: "#566573",
    marginTop: 4,
  },
  manifestoTitle: {
    fontSize: 14,
    color: "#34495E",
    fontWeight: "600",
    marginTop: 6,
  },
  manifesto: {
    fontSize: 13,
    color: "#444",
    marginTop: 2,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
    color: "#888",
  },
});
