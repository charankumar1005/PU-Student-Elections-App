import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  TextInput,
} from "react-native";
import {
  Card,
  Avatar,
  Text,
  IconButton,
  useTheme,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ApprovedCandidatesScreen = () => {
  const [approvedList, setApprovedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); // Added search query state
  const theme = useTheme();

  // Function to fetch approved candidates
  const fetchApprovedCandidates = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      const response = await fetch(
        "http://192.168.151.139:5000/api/nominations?status=approved&groupBy=department",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const json = await response.json();
      if (!json.success) {
        throw new Error(json.message || "Failed to fetch approved nominations");
      }

      const formattedData = json.data.map((section) => ({
        title: section.department,
        count: section.nominations.length,
        data: section.nominations.map((n) => ({
          _id: n._id,
          name: n.candidate?.name || "N/A",
          department: section.department,
          gender: n.candidate?.gender || "N/A",
          age: n.candidate?.age || "N/A",
          category: n.candidate?.category || "N/A",
          programName: n.candidate?.programName || "N/A",
          imageUrl: n.candidate?.image
            ? `http://192.168.151.139:5000/${n.candidate.image}`
            : null,
        })),
      }));

      setApprovedList(formattedData);
    } catch (err) {
      console.error("❌ Error fetching approved candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedCandidates();
  }, []);

  // Function to handle search query
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Function to filter the approved list based on search query
  const filterCandidates = (data) => {
    if (!searchQuery) return data;

    return data.filter((item) =>
      Object.values(item)
        .join(" ")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  };

  // Function to render avatar for candidate
  const renderAvatar = (item) => {
    if (item.imageUrl) {
      return (
        <Avatar.Image
          size={48}
          source={{ uri: item.imageUrl }}
          style={styles.avatar}
        />
      );
    } else {
      const initial = item.name.charAt(0).toUpperCase();
      return (
        <Avatar.Text
          size={48}
          label={initial}
          style={[styles.avatar, { backgroundColor: "#6200ea" }]}
        />
      );
    }
  };

  // Render each candidate item
  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Title
        title={item.name}
        titleStyle={styles.name}
        left={() => renderAvatar(item)}
      />
      <Card.Content>
        <Text style={styles.detail}>Department: {item.department}</Text>
        <Text style={styles.detail}>Program: {item.programName}</Text>
        <Text style={styles.detail}>Gender: {item.gender}</Text>
        <Text style={styles.detail}>Age: {item.age}</Text>
        <Text style={styles.detail}>Category: {item.category}</Text>
      </Card.Content>
    </Card>
  );

  // Render section headers for each department
  const renderSectionHeader = ({ section: { title, count } }) => (
    <View style={styles.sectionHeaderContainer}>
      <Text style={styles.sectionHeader}>
        {title} <Text style={styles.count}>({count})</Text>
      </Text>
    </View>
  );

  // If loading, show a loading indicator
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Apply the search filter to the approved list
  const filteredList = approvedList.map((section) => ({
    ...section,
    data: filterCandidates(section.data),
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Approved Candidates</Text>

      {/* Search Bar */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search candidates..."
        value={searchQuery}
        onChangeText={handleSearch}
      />

      <SectionList
        sections={filteredList}
        keyExtractor={(item, index) => item._id + index}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
};

export default ApprovedCandidatesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    backgroundColor: "#F4F6F8",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#1E1E1E",
  },
  searchInput: {
    height: 40,
    borderColor: "#6200ea",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingLeft: 10,
    color: "#424242",
  },
  sectionHeaderContainer: {
    backgroundColor: "#E0E7FF",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A237E",
  },
  count: {
    fontWeight: "600",
    color: "#3749A2",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginVertical: 6,
    elevation: 2,
  },
  avatar: {
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  detail: {
    fontSize: 14,
    marginTop: 4,
    color: "#424242",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
