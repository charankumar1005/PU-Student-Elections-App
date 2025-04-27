import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,// Import Modal
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { schoolsAndDepartments } from "../data/data"; // Import the data

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [selectedSchool, setSelectedSchool] = useState(""); // new state for selected school
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    level: "",
    color: "gray",
    score: 0,
  });

  const [modalVisible, setModalVisible] = useState(true); // Initial state is visible

  useEffect(() => {
    // No need for any logic here, as we want the modal to show on load
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const sendOTP = async () => {
    if (!email || !validateEmail(email)) {
      return Alert.alert("Error", "Enter a valid email");
    }

    try {
      const response = await fetch("http://192.168.151.139:5000/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setOtpSent(true);
        Alert.alert("Success", "OTP sent to your email.");
      } else {
        Alert.alert("Error", data.error || "Failed to send OTP");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again.");
    }
  };

  const verifyOTP = async () => {
    if (!otp) return Alert.alert("Error", "Enter OTP");

    try {
      const response = await fetch("http://192.168.151.139:5000/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      if (response.ok) {
        setOtpVerified(true);
        Alert.alert("Success", "Email verified successfully!");
      } else {
        Alert.alert("Error", data.error || "Invalid OTP");
      }
    } catch (error) {
      Alert.alert("Error", "Network error. Please try again.");
    }
  };

  const validateInputs = () => {
    let validationErrors = {};

    if (!fullName.trim()) {
      validationErrors.fullName = "Full name is required";
    }

    if (!studentId.trim()) {
      validationErrors.studentId = "Registration number is required";
    }

    if (password !== confirmPassword) {
      validationErrors.confirmPassword = "❌ Your passwords do not match!";
    }

    if (!selectedSchool) {
      validationErrors.selectedSchool = "Please select a school!";
    }

    if (!department) {
      validationErrors.department = "Please select a department!";
    }

    if (!/^\d{10}$/.test(phone)) {
      validationErrors.phone = "📞 Phone number must be exactly 10 digits!";
    }

    if (passwordStrength.score < 2) {
      validationErrors.password = "🔒 Password must be stronger!";
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const checkPasswordStrength = (password) => {
    let score = 0;
    let strength = { level: "Weak", color: "#ff4d4d", score: 1 };

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;

    if (score === 1) strength = { level: "Weak", color: "#ff4d4d", score };
    else if (score === 2)
      strength = { level: "Medium", color: "#ffcc00", score };
    else if (score >= 3)
      strength = { level: "Strong", color: "#28a745", score };

    setPasswordStrength(strength);
  };

  // Replace your handleRegister function with this corrected version
  const handleRegister = async () => {
    if (!otpVerified) {
      return Alert.alert(
        "Error",
        "Please verify your email OTP before registering."
      );
    }

    if (!validateInputs()) return;

    try {
      // Create a formData object
      const requestBody = {
        fullName,
        email,
        studentId,
        department,
        phone,
        password,
      };

      console.log("Sending registration data to server");

      // Send the request with the correct content type header
      const response = await fetch("http://192.168.151.139:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // Handle the response
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Registration successful!");
        router.push("/UserDashboardScreens/login");
      } else {
        Alert.alert("Error", data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert("Error", "Network error, please try again later.");
    }
  };

  const getDepartmentsForSchool = () => {
    if (!selectedSchool) return [];
    const school = schoolsAndDepartments.find((s) => s.name === selectedSchool);
    return school ? school.departments : [];
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Disclaimer Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          // Alert.alert("Modal has been closed.");
          setModalVisible(!modalVisible); // Handle back press on Android
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Please provide accurate information during registration. Providing
              incorrect or misleading details may result in account suspension or
              deletion as per the university's policies.
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.textStyle}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.container}>
        <Text style={styles.title}>Register</Text>

        {/* Personal Information */}
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
        />
        {errors.fullName && (
          <Text style={styles.errorText}>{errors.fullName}</Text>
        )}

        {/* Email and OTP Verification */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          editable={!otpVerified}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        {!otpVerified ? (
          <>
            {otpSent ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  keyboardType="numeric"
                  value={otp}
                  onChangeText={setOtp}
                />
                <TouchableOpacity style={styles.button} onPress={verifyOTP}>
                  <Text style={styles.buttonText}>Verify OTP</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={sendOTP}
                >
                  <Text style={styles.secondaryButtonText}>Resend OTP</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.button} onPress={sendOTP}>
                <Text style={styles.buttonText}>Send OTP</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.verifiedContainer}>
            <Text style={styles.verifiedText}>Email Verified ✓</Text>
          </View>
        )}

        {/* Registration Info */}
        <TextInput
          style={styles.input}
          placeholder="Registration No"
          value={studentId}
          onChangeText={setStudentId}
        />
        {errors.studentId && (
          <Text style={styles.errorText}>{errors.studentId}</Text>
        )}

        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(text) => {
            if (/^\d{0,10}$/.test(text)) setPhone(text);
          }}
        />
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedSchool}
            onValueChange={setSelectedSchool}
            style={styles.picker}
          >
            <Picker.Item label="Select School" value="" />
            {schoolsAndDepartments.map((school) => (
              <Picker.Item key={school.name} label={school.name} value={school.name} />
            ))}
          </Picker>
          {errors.selectedSchool && (
            <Text style={styles.errorText}>{errors.selectedSchool}</Text>
          )}
        </View>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={department}
            onValueChange={setDepartment}
            style={styles.picker}
            enabled={!!selectedSchool} // Disable if no school selected
          >
            <Picker.Item label="Select Department" value="" />
            {getDepartmentsForSchool().map((dept) => (
              <Picker.Item key={dept} label={dept} value={dept} />
            ))}
          </Picker>
          {errors.department && (
            <Text style={styles.errorText}>{errors.department}</Text>
          )}
        </View>

        {/* Password Section */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              checkPasswordStrength(text);
            }}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="gray" />
          </TouchableOpacity>
        </View>

        <View style={styles.strengthBarContainer}>
          <View
            style={[
              styles.strengthBar,
              {
                backgroundColor: passwordStrength.color,
                width: `${passwordStrength.score * 33}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
          {passwordStrength.level}
        </Text>
        {errors.password && (
          <Text style={styles.errorText}>{errors.password}</Text>
        )}

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm Password"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off" : "eye"}
              size={24}
              color="gray"
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && (
          <Text style={styles.errorText}>{errors.confirmPassword}</Text>
        )}

        {/* Register Button */}
        <TouchableOpacity
          style={[styles.button, !otpVerified && styles.disabledButton]}
          onPress={handleRegister}
          disabled={!otpVerified}
        >
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/UserDashboardScreens/login")}>
          <Text style={styles.linkText}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10, // Reduced margin to accommodate disclaimer
    color: "#333",
  },
  disclaimerText: {
    fontSize: 14,
    color: "red",
    textAlign: "center",
    marginBottom: 15, // Added margin below disclaimer
    paddingHorizontal: 10,
  },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#eee",
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginVertical: 8,
    paddingRight: 10,
    backgroundColor: "#fff",
  },
  passwordInput: {
    flex: 1,
    padding: 12,
  },
  strengthBarContainer: {
    width: "100%",
    height: 6,
    backgroundColor: "#ddd",
    borderRadius: 5,
    marginVertical: 5,
  },
  strengthBar: {
    height: "100%",
    borderRadius: 5,
  },
  strengthText: {
    fontSize: 14,
    fontWeight: "bold",
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    padding: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 5,
  },
  secondaryButtonText: {
    color: "#007bff",
    fontSize: 14,
  },
  errorText: {
    color: "red",
    fontSize: 14,
    alignSelf: "flex-start",
    marginLeft: 5,
  },
  linkText: {
    color: "#007bff",
    marginTop: 15,
    marginBottom: 20,
  },
  pickerContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  verifiedContainer: {
    width: "100%",
    backgroundColor: "#d4edda",
    borderColor: "#c3e6cb",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
    alignItems: "center",
  },
  verifiedText: {
    color: "#155724",
    fontWeight: "bold",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
});
