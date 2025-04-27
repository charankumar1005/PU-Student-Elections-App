import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function ImageUpload() {
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photos to upload images"
        );
      }
    })();
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        // Check file size before setting image
        const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
        if (fileInfo.size > 10 * 1024 * 1024) {
          Alert.alert("Error", "Image size exceeds 10MB limit");
          return;
        }
        
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
      console.error("Image pick error:", error);
    }
  };

  const handleUpload = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        Alert.alert("Error", "You need to be logged in to upload images");
        router.push("/screens/login");
        return;
      }

      if (!image) {
        Alert.alert("Error", "Please select an image first");
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      // Create form data with file
      const formData = new FormData();
      formData.append('image', {
        uri: image,
        name: `image_${Date.now()}.jpg`,
        type: 'image/jpeg'
      });

      const response = await axios.post(
      "http://192.168.151.139:5000/api/images/upload",
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 30000, // 30-second timeout
        onUploadProgress: (progressEvent) => {
          // Add null check for progressEvent.total
          const progress = progressEvent.total ? 
            Math.round((progressEvent.loaded / progressEvent.total) * 100) : 0;
          setUploadProgress(progress);
        },
      }
    );

    if (response.data.success) {
      Alert.alert(
        "Success", 
        response.data.message,
        [{ text: "OK", onPress: () => router.back() }]
      );
      setImage(response.data.imageUrl); // Set full URL for preview
    } else {
      throw new Error(response.data.message || "Upload failed");
    }
  } catch (error) {
    let errorMessage = "Failed to upload image";
    
    // Handle network errors separately
    if (error.code === 'ECONNABORTED') {
      errorMessage = "Connection timeout. Please try again";
    } else if (!error.response) {
      errorMessage = "Network error. Check your connection";
    } else {
      switch (error.response.status) {
        case 401:
          errorMessage = "Session expired. Please login again";
          await AsyncStorage.removeItem("userToken");
          router.replace("/screens/login");
          break;
        case 413:
          errorMessage = "Image size exceeds 10MB limit";
          break;
        case 500:
          errorMessage = error.response.data?.message || "Server error. Please try later";
          break;
      }
    }

    Alert.alert("Upload Failed", errorMessage);
    console.error("Upload error:", error);
  } finally {
    setUploading(false);
    setUploadProgress(0);
  }
};

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.imagePicker}
        onPress={pickImage}
        disabled={uploading}
      >
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.imagePreview}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.uploadPrompt}>
            <Ionicons name="cloud-upload" size={40} color="#007AFF" />
            <Text style={styles.placeholderText}>
              {uploading ? "Uploading..." : "Tap to select an image"}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {uploadProgress > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Upload Progress: {uploadProgress}%
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${uploadProgress}%` }
              ]}
            />
          </View>
        </View>
      )}

      {image && !uploading && (
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleUpload}
          disabled={uploading}
        >
          <Text style={styles.buttonText}>
            <Ionicons name="send" size={18} color="white" /> Upload Image
          </Text>
        </TouchableOpacity>
      )}

      {uploading && (
        <ActivityIndicator
          size="large"
          color="#007AFF"
          style={styles.loader}
        />
      )}
    </View>
  );
}

// Keep the same styles as before
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#F5FCFF",
  },
  imagePicker: {
    width: width * 0.9,
    height: 300,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderRadius: 10,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  uploadPrompt: {
    alignItems: "center",
    gap: 10,
  },
  placeholderText: {
    color: "#007AFF",
    fontSize: 16,
    textAlign: "center",
  },
  uploadButton: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 20,
    gap: 10,
    elevation: 3,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  progressContainer: {
    width: "90%",
    marginTop: 20,
  },
  progressText: {
    color: "#333",
    fontSize: 14,
    marginBottom: 5,
  },
  progressBar: {
    height: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
  },
  loader: {
    marginTop: 20,
  },
});