import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  FlatList,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Card, Button } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";

const numColumns = 2;
const { width } = Dimensions.get("window");
const imageSize = width / numColumns - 40;

const Vote = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchApprovedCandidates = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch("http://192.168.151.139:5000/api/approved-candidates", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();
      if (!json.success || !Array.isArray(json.data)) {
        throw new Error("Invalid data format.");
      }

      const formatted = json.data
        .filter(n => n._id)
        .map(n => ({
          id: n._id, // <--- use Nomination._id
          name: n.candidate.name || "N/A",
          department: n.candidate.department || "N/A",
          manifesto: n.candidate.manifesto || "No manifesto provided.",
          gender: n.candidate.gender || "N/A",
          category: n.candidate.category || "N/A",
          programName: n.candidate.programName || "N/A",
          imageUrl: n.candidate.image
            ? `http://192.168.151.139:5000/${n.candidate.image}`
            : null,
        }));

      setCandidates(formatted);
    } catch (err) {
      console.error("❌ Error fetching candidates:", err);
      Alert.alert("Error", "Failed to load candidates. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApprovedCandidates();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchApprovedCandidates();
  }, []);

  const openModal = (candidate) => {
    setSelectedCandidate(candidate);
    setModalVisible(true);
  };

  const handleVote = async (candidate) => {
    if (!candidate?.id) {
      Alert.alert("❌ Error", "Invalid candidate ID.");
      return;
    }

    Alert.alert(
      "Confirm Vote",
      `Are you sure you want to vote for ${candidate.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("userToken");
              const response = await fetch("http://192.168.151.139:5000/api/vote", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  candidateId: candidate.id,
                  category: candidate.category,
                }),
              });
              const text = await response.text();
              console.log("Vote API response:", text);
              const result = JSON.parse(text);

              if (result.success) {
                Alert.alert("✅ Vote Submitted", `You voted for ${candidate.name}`);
              } else {
                Alert.alert("❌ Error", result.message || "Failed to submit vote.");
              }
            } catch (error) {
              console.error("Vote Error:", error);
              Alert.alert("❌ Error", "Something went wrong during voting.");
            }
          },
        },
      ]
    );
  };

  const renderCandidate = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openModal(item)}>
      <View style={styles.outerCircle}>
        <View style={styles.imageWrapper}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Text>No Image</Text>
            </View>
          )}
        </View>
        <View style={styles.badge}>
          <MaterialIcons name="how-to-vote" size={14} color="white" />
          <Text style={styles.badgeText}>Vote for Me</Text>
        </View>
      </View>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.category}>{item.category}</Text>
      <Button mode="contained" style={styles.voteButton} onPress={() => handleVote(item)}>
        Vote
      </Button>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🗳️ Vote - Approved Candidates</Text>
      <FlatList
        data={candidates}
        renderItem={renderCandidate}
        keyExtractor={(item, index) => item.id || item.name + index}
        numColumns={numColumns}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      />

      {/* Candidate Details Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              {selectedCandidate && (
                <>
                  {selectedCandidate.imageUrl && (
                    <Image source={{ uri: selectedCandidate.imageUrl }} style={styles.modalImage} />
                  )}
                  <Text style={styles.modalTitle}>{selectedCandidate.name}</Text>
                  <Text style={styles.modalText}>🏛️ Department: {selectedCandidate.department}</Text>
                  <Text style={styles.modalText}>📌 Category: {selectedCandidate.category}</Text>
                  <Text style={styles.modalText}>📝 Manifesto:</Text>
                  <Text style={styles.manifestoText}>{selectedCandidate.manifesto}</Text>
                  <Button
                    icon="check"
                    mode="contained"
                    style={{ marginVertical: 8 }}
                    onPress={() => {
                      handleVote(selectedCandidate);
                      setModalVisible(false);
                    }}
                  >
                    Vote
                  </Button>
                  <Button onPress={() => setModalVisible(false)}>Close</Button>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 16, backgroundColor: "#f0f0f0" },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", marginBottom: 12 },
  list: { paddingHorizontal: 10, paddingBottom: 60 },
  card: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    margin: 8,
    borderRadius: 16,
    elevation: 4,
  },
  outerCircle: {
    width: imageSize,
    height: imageSize,
    borderRadius: imageSize / 2,
    backgroundColor: "#D6EAF8",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  imageWrapper: {
    width: imageSize - 20,
    height: imageSize - 20,
    borderRadius: (imageSize - 20) / 2,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#AED6F1",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    bottom: 0,
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  badgeText: { color: "white", fontSize: 10, marginLeft: 4 },
  name: { fontSize: 14, fontWeight: "bold", marginTop: 8 },
  category: { fontSize: 12, color: "#666" },
  voteButton: { marginTop: 6, backgroundColor: "#28A745" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center" },
  modalContainer: { backgroundColor: "#fff", margin: 20, borderRadius: 12, padding: 16, maxHeight: "80%" },
  modalContent: { alignItems: "center" },
  modalImage: { width: 140, height: 140, borderRadius: 70, marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 6 },
  modalText: { fontSize: 14, textAlign: "center", marginVertical: 2 },
  manifestoText: { fontSize: 13, color: "#555", marginVertical: 8, textAlign: "center" },
});

export default Vote;
