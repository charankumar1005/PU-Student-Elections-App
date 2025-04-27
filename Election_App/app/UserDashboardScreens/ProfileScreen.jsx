import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  Alert,
  Image,
  StyleSheet,
} from "react-native";
import {
  Avatar,
  Button,
  Card,
  Text,
  TextInput,
  ActivityIndicator,
  Title,
  useTheme,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export default function ProfileScreen() {
  const theme = useTheme();
  const [profile, setProfile] = useState({
    fullName: "",
    studentId: "",
    department: "",
    phone: "",
    email: "",
    profileImage: null,
  });
  const [userImages, setUserImages] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("userToken");

        if (!token) {
          Alert.alert("Error", "Authentication failed. Please log in again.");
          return;
        }

        const profileRes = await fetch("http://192.168.151.139:5000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!profileRes.ok) throw new Error("Failed to fetch profile");

        const profileData = await profileRes.json();
        setProfile(profileData);

        const imagesRes = await axios.get(
          "http://192.168.151.139:5000/api/images/my-images",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const formatted = imagesRes.data.map(img => ({
          id: img._id,
          imageUrl: img.url,
        }));
        setUserImages(formatted);

      } catch (error) {
        Alert.alert("Error", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("userToken");

      const response = await fetch("http://192.168.151.139:5000/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) throw new Error("Update failed");

      Alert.alert("Success", "Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!passwords.currentPassword || !passwords.newPassword) {
        Alert.alert("Error", "Please fill in both password fields.");
        return;
      }

      setLoading(true);
      const token = await AsyncStorage.getItem("userToken");

      const response = await fetch("http://192.168.151.139:5000/api/profile/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(passwords),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Password change failed");

      Alert.alert("Success", result.message);
      setPasswords({ currentPassword: "", newPassword: "" });
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.header}>
          {profile.profileImage || userImages[0]?.imageUrl ? (
            <Avatar.Image
              size={100}
              source={{ uri: profile.profileImage || userImages[0].imageUrl }}
              style={{ marginBottom: 12 }}
            />
          ) : (
            <Avatar.Icon size={100} icon="account-circle" />
          )}
          <Title style={styles.name}>{profile.fullName || "Your Name"}</Title>
          <Text style={styles.email}>{profile.email}</Text>
          <Button
            mode="contained"
            style={styles.editBtn}
            icon={isEditing ? "content-save" : "pencil"}
            onPress={isEditing ? handleUpdate : () => setIsEditing(true)}
          >
            {isEditing ? "Save" : "Edit Profile"}
          </Button>
        </Card.Content>
      </Card>

      {/* Personal Info Section */}
      <Card style={styles.card}>
        <Card.Title title="Personal Information" />
        <Card.Content>
          <InputField
            label="Student ID"
            value={profile.studentId}
            editable={isEditing}
            onChangeText={text => setProfile(p => ({ ...p, studentId: text }))}
          />
          <InputField
            label="Department"
            value={profile.department}
            editable={isEditing}
            onChangeText={text => setProfile(p => ({ ...p, department: text }))}
          />
          <InputField
            label="Phone"
            value={profile.phone}
            editable={isEditing}
            onChangeText={text => setProfile(p => ({ ...p, phone: text }))}
          />
        </Card.Content>
      </Card>

      {/* Password Section */}
      <Card style={styles.card}>
        <Card.Title title="Change Password" />
        <Card.Content>
          <TextInput
            label="Current Password"
            value={passwords.currentPassword}
            secureTextEntry
            onChangeText={text => setPasswords({ ...passwords, currentPassword: text })}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="New Password"
            value={passwords.newPassword}
            secureTextEntry
            onChangeText={text => setPasswords({ ...passwords, newPassword: text })}
            style={styles.input}
            mode="outlined"
          />
          <Button
            icon="lock-reset"
            mode="contained"
            onPress={handleChangePassword}
            style={styles.passwordBtn}
          >
            Update Password
          </Button>
        </Card.Content>
      </Card>

      {loading && <ActivityIndicator animating color={theme.colors.primary} size="large" />}
    </ScrollView>
  );
}

const InputField = ({ label, value, editable, onChangeText }) => (
  <TextInput
    label={label}
    value={value}
    onChangeText={onChangeText}
    style={styles.input}
    mode="outlined"
    editable={editable}
  />
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f7f7f7",
    padding: 10,
  },
  card: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 2,
  },
  header: {
    alignItems: "center",
    paddingBottom: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 8,
  },
  email: {
    fontSize: 16,
    color: "#777",
    marginBottom: 10,
  },
  input: {
    marginBottom: 16,
  },
  editBtn: {
    marginTop: 10,
    borderRadius: 8,
  },
  passwordBtn: {
    marginTop: 10,
    borderRadius: 8,
  },
});
