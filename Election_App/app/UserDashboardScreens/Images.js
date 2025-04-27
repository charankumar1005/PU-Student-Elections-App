import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function MyImagesScreen() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "You need to be logged in");
        return router.push("/screens/login");
      }

      const response = await axios.get(
        "http://192.168.151.139:5000/api/images/my-images",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const formattedImages = response.data.map((img) => ({
        id: img._id,
        filename: img.filename,
        imageUrl: img.url, // Use direct path from backend
        uploadedAt: img.uploadedAt,
      }));

      setImages(formattedImages);
    } catch (error) {
      handleFetchError(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFetchError = (error) => {
    if (error.response?.status === 404) {
      setImages([]);
    } else if (error.response) {
      Alert.alert(
        "Error",
        `Server Error: ${error.response.status} - ${error.response.data?.message || "Unknown error"}`
      );
    } else {
      Alert.alert("Error", "Network Error - Could not connect to server");
    }
  };

  const deleteImage = async (id) => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      await axios.delete(`http://192.168.151.139:5000/api/images/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setImages((prev) => prev.filter((image) => image.id !== id));
      Alert.alert("Success", "Image deleted successfully");
    } catch (error) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to delete image"
      );
    }
  };

  const renderImageItem = ({ item }) => (
    <View style={styles.imageContainer}>
      <Image
  source={{ uri: item.imageUrl }} // Use imageUrl, not url
  style={styles.image}
  resizeMode="cover"
  onError={(e) => console.log("Failed to load image:", e.nativeEvent.error)}
/>

      <View style={styles.infoContainer}>
        <Text style={styles.filenameText} numberOfLines={1}>
          {item.filename}
        </Text>
        <Text style={styles.dateText}>
          Uploaded: {new Date(item.uploadedAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => deleteImage(item.id)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Uploaded Images</Text>
      
      <FlatList
        data={images}
        renderItem={renderImageItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No images found</Text>
        }
        refreshing={refreshing}
        onRefresh={fetchImages}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 20,
    textAlign: "center",
  },
  imageContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  infoContainer: {
    padding: 12,
  },
  filenameText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
  },
  deleteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255, 59, 48, 0.8)",
    padding: 8,
    borderRadius: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    marginTop: 40,
  },
  listContent: {
    paddingBottom: 20,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});