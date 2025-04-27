import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Platform,
  Linking,
  Image
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Ionicons from "react-native-vector-icons/Ionicons";
import { schoolsAndDepartments } from "../data/data";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from 'expo-image-picker';
import { Menu } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Buffer } from 'buffer';

const API_URL = "http://192.168.151.139:5000";
const formSections = ["Candidate Details", "Proposer Details", "Seconder Details", "Document Upload"];
const currentYear = new Date().getFullYear();
const admissionYears = Array.from({ length: 25 }, (_, i) => currentYear - i + 1).reverse();

const ageRules = {
  "I (UG)": { min: 19, max: 21 },
  "II(PG)": { min: 21, max: 24 },
  "III(Scholar)": { min: 24, max: 27 },
};

export default function NominationScreen() {
  const [currentSection, setCurrentSection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [disclaimerVisible, setDisclaimerVisible] = useState(true);
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [candidateImage, setCandidateImage] = useState(null);
  const [proposerImage, setProposerImage] = useState(null);
  const [seconderImage, setSeconderImage] = useState(null);
  const [eligibilityError, setEligibilityError] = useState('');

  const initialFullDetails = {
    name: "",
    school: "",
    department: "",
    programName: "",
    age: "",
    dob: "",
    gender: "",
    admissionYear: "",
    regNo: "",
    fullTimeStudent: false,
    category: "",
    hasArrears: false,
    attendance: false,
    hasCriminalProceedings: false,
    hasDisciplinaryActions: false,
    manifesto: "",
  };

  const [candidate, setCandidate] = useState({ ...initialFullDetails });
  const [proposer, setProposer] = useState({ ...initialFullDetails });
  const [seconder, setSeconder] = useState({ ...initialFullDetails });

  useEffect(() => {
    checkEligibility();
  }, [candidate]);

  const checkEligibility = () => {
    const disqualifiers = [];
    if (candidate.hasArrears) disqualifiers.push('Arrears');
    if (candidate.hasCriminalProceedings) disqualifiers.push('Criminal cases');
    if (candidate.hasDisciplinaryActions) disqualifiers.push('Disciplinary actions');
    if (!candidate.fullTimeStudent) disqualifiers.push('Not a full-time student');
    if (!candidate.attendance) disqualifiers.push('Less than 75% attendance');

    setEligibilityError(disqualifiers.length > 0 
      ? `You are not eligible for nominations due to: ${disqualifiers.join(', ')}`
      : '');
  };

  const showInstructions = () => {
  Alert.alert(
    "Nomination Instructions",
    "Please read the following instructions carefully before submitting your nomination:\n\n" +
    "1. Fill all sections completely and accurately.\n" +
    "2. Upload all required documents in the appropriate format.\n" +
    "3. Ensure eligibility criteria are met:\n" +
    "   - For UG students: Age must be between 18 and 20 years.\n" +
    "   - For PG students: Age must be between 21 and 23 years.\n" +
    "   - For PhD students: Age must be between 24 and 26 years.\n" +
    "4. The student must have **no arrears** in any subject.\n" +
    "5. The student must not have any **criminal cases** pending.\n" +
    "6. A minimum of **75% attendance** is mandatory to be eligible.\n" +
    "7. Submit the nomination form before the deadline to avoid disqualification.\n",
    [{ text: "OK" }]
  );
};


  const handleFileUpload = async () => {
    try {
      setErrors(prev => ({ ...prev, file: undefined }));
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (res.canceled) return;

      setUploadedFile({
        name: res.assets[0].name,
        uri: res.assets[0].uri,
        type: res.assets[0].mimeType,
      });

    } catch (err) {
      setErrors(prev => ({ ...prev, file: 'Failed to select file. Please try again.' }));
      Alert.alert('Error', 'Failed to select PDF file.');
    }
  };

  const handleImageUpload = async (setImageFunction) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Need camera roll access to upload images');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImageFunction(result.assets[0].uri);
    }
  };

  const handleDownloadForm = async () => {
    try {
      const downloadUrl = `${API_URL}/download-nomination-form`;
      const supported = await Linking.canOpenURL(downloadUrl);
      
      if (supported) {
        await Linking.openURL(downloadUrl);
      } else {
        Alert.alert('Error', 'Unable to open download link');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to download form');
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const dob = selectedDate.toISOString().split("T")[0];
      const age = calculateAge(selectedDate);
      const setter = [setCandidate, setProposer, setSeconder][currentSection];
      setter(prev => ({ ...prev, dob, age }));
    }
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const validateAge = (data) => {
    if (!data.category) return true;
    const age = parseInt(data.age);
    const { min, max } = ageRules[data.category];
    return age >= min && age <= max;
  };

  const validateSection = (data) => {
    const newErrors = {};
    
    if (!data.name) newErrors.name = "Name is required";
    if (!data.school) newErrors.school = "School is required";
    if (!data.department) newErrors.department = "Department is required";
    if (!data.category) newErrors.category = "Category is required";
    if (!data.dob) newErrors.dob = "Date of Birth is required";
    if (!data.admissionYear) newErrors.admissionYear = "Admission Year is required";
    if (!validateAge(data)) newErrors.age = `Age must be ${ageRules[data.category].min}-${ageRules[data.category].max}`;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToNextSection = () => {
    const currentData = [candidate, proposer, seconder][currentSection];
    if (validateSection(currentData)) {
      if (currentSection < formSections.length - 1) {
        setCurrentSection(currentSection + 1);
      }
    }
  };

  const goToPreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = async () => {
    if (![candidate, proposer, seconder].every(validateSection) || !uploadedFile) {
      Alert.alert("Error", "Please fill all sections and upload the nomination form");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) throw new Error("Authentication required");

      const formData = new FormData();
      if (candidateImage) {
    formData.append('candidateImage', {
      uri: candidateImage,
      name: 'candidate.jpg',
      type: 'image/jpeg'
    });
  }
  
  if (proposerImage) {
    formData.append('proposerImage', {
      uri: proposerImage,
      name: 'proposer.jpg',
      type: 'image/jpeg'
    });
  }

  if (seconderImage) {
    formData.append('seconderImage', {
      uri: seconderImage,
      name: 'seconder.jpg',
      type: 'image/jpeg'
    });
  }
      formData.append("candidate", JSON.stringify(candidate));
      formData.append("proposer", JSON.stringify(proposer));
      formData.append("seconder", JSON.stringify(seconder));

      formData.append('document', {
        uri: uploadedFile.uri,
        name: uploadedFile.name.replace(/\s/g, '_'),
        type: 'application/pdf',
      });

      const response = await fetch(`${API_URL}/nominations`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": 'multipart/form-data',
        },
        body: formData,
      });

      const responseData = await response.json();
      
      if (!response.ok) throw new Error(responseData.message || "Submission failed");

      Alert.alert("Success", "Nomination submitted successfully!");
      setCandidate(initialFullDetails);
      setProposer(initialFullDetails);
      setSeconder(initialFullDetails);
      setUploadedFile(null);
      setCurrentSection(0);
      // 
       const pdfArrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(pdfArrayBuffer).toString('base64');

    // Save PDF to local storage
    const fileUri = FileSystem.documentDirectory + 'nomination_form.pdf';
    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Share the PDF for download
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Download Nomination Form',
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('Success', 'Nomination submitted! PDF saved to device.');
    }

    // Reset form and show success
    Alert.alert("Success", "Nomination submitted successfully! PDF downloaded.");
    setCandidate(initialFullDetails);
    setProposer(initialFullDetails);
    setSeconder(initialFullDetails);
    setUploadedFile(null);
    setCurrentSection(0);

  // } catch (error) {
  //   Alert.alert("Error", error.message || "Submission failed. Please check your connection.");
  // } finally {
  //   setIsSubmitting(false);
  // }

    } catch (error) {
      Alert.alert("Error", error.message || "Submission failed. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
    
  };

  const YesNoToggle = ({ label, value, onPress }) => (
    <View style={styles.yesnoContainer}>
      <Text style={styles.yesnoLabel}>{label}</Text>
      <View style={styles.yesnoButtonGroup}>
        <TouchableOpacity
          style={[styles.yesnoButton, value && styles.yesnoSelected]}
          onPress={() => onPress(true)}
        >
          <Ionicons 
            name={value ? "checkmark-circle" : "radio-button-off"} 
            size={24} 
            color={value ? "#007AFF" : "#666"} 
          />
          <Text style={styles.yesnoText}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.yesnoButton, !value && styles.yesnoSelected]}
          onPress={() => onPress(false)}
        >
          <Ionicons 
            name={!value ? "checkmark-circle" : "radio-button-off"} 
            size={24} 
            color={!value ? "#007AFF" : "#666"} 
          />
          <Text style={styles.yesnoText}>No</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const CategorySelector = ({ selected, onSelect }) => (
    <View style={styles.categoryContainer}>
      {["I (UG)", "II(PG)", "III(Scholar)"].map((cat) => (
        <TouchableOpacity
          key={cat}
          style={[
            styles.categoryButton,
            selected === cat && styles.categorySelected
          ]}
          onPress={() => onSelect(cat)}
        >
          <Text style={[
            styles.categoryText,
            selected === cat && styles.categoryTextSelected
          ]}>
            Category {cat}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderFormSection = (title, state, setState, image, setImage) => {
    const currentSchool = schoolsAndDepartments.find(s => s.name === state.school);
    const departments = currentSchool ? currentSchool.departments : [];
    const isCandidate = title === "Candidate Details";

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>

        <TouchableOpacity 
          style={styles.imageUploadContainer}
          onPress={() => handleImageUpload(setImage)}
        >
          {image ? (
            <Image source={{ uri: image }} style={styles.imagePreview} />
          ) : (
            <View style={styles.uploadImagePlaceholder}>
              <Ionicons name="camera" size={32} color="#666" />
              <Text>Upload Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={state.school}
            onValueChange={value => setState({ ...state, school: value, department: "" })}
          >
            <Picker.Item label="Select School" value="" />
            {schoolsAndDepartments.map(school => (
              <Picker.Item key={school.name} label={school.name} value={school.name} />
            ))}
          </Picker>
          {errors.school && <Text style={styles.errorText}>{errors.school}</Text>}
        </View>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={state.department}
            onValueChange={value => setState({ ...state, department: value })}
            enabled={!!state.school}
          >
            <Picker.Item label="Select Department" value="" />
            {departments.map(dept => (
              <Picker.Item key={dept} label={dept} value={dept} />
            ))}
          </Picker>
          {errors.department && <Text style={styles.errorText}>{errors.department}</Text>}
        </View>

        <CategorySelector
          selected={state.category}
          onSelect={category => setState({ ...state, category })}
        />
        {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}

        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={state.dob ? styles.inputText : styles.placeholderText}>
            {state.dob || "Date of Birth (YYYY-MM-DD)"}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={state.dob ? new Date(state.dob) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? "spinner" : "default"}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
        {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Age"
          value={state.age}
          editable={false}
        />
        {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={state.admissionYear}
            onValueChange={value => setState({ ...state, admissionYear: value })}
          >
            <Picker.Item label="Select Admission Year" value="" />
            {admissionYears.map(year => (
              <Picker.Item key={year} label={year.toString()} value={year} />
            ))}
          </Picker>
          {errors.admissionYear && <Text style={styles.errorText}>{errors.admissionYear}</Text>}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={state.name}
          onChangeText={text => setState({ ...state, name: text })}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Program Name"
          value={state.programName}
          onChangeText={text => setState({ ...state, programName: text })}
        />

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={state.gender}
            onValueChange={value => setState({ ...state, gender: value })}
          >
            <Picker.Item label="Select Gender" value="" />
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Registration Number"
          value={state.regNo}
          onChangeText={text => setState({ ...state, regNo: text })}
        />

        <YesNoToggle
          label="Full-Time Student/Scholar?"
          value={state.fullTimeStudent}
          onPress={val => setState({ ...state, fullTimeStudent: val })}
        />

        <YesNoToggle
          label="Academic Arrears?"
          value={state.hasArrears}
          onPress={val => setState({ ...state, hasArrears: val })}
        />

        <YesNoToggle
          label="75% Attendance?"
          value={state.attendance}
          onPress={val => setState({ ...state, attendance: val })}
        />

        <YesNoToggle
          label="Criminal Proceedings?"
          value={state.hasCriminalProceedings}
          onPress={val => setState({ ...state, hasCriminalProceedings: val })}
        />

        <YesNoToggle
          label="Disciplinary Actions?"
          value={state.hasDisciplinaryActions}
          onPress={val => setState({ ...state, hasDisciplinaryActions: val })}
        />

        {isCandidate && eligibilityError ? (
          <Text style={styles.eligibilityError}>{eligibilityError}</Text>
        ) : null}

        {isCandidate && (
          <TextInput
            style={[styles.input, styles.manifestoInput]}
            placeholder="Manifesto"
            multiline
            value={state.manifesto}
            onChangeText={text => setState({ ...state, manifesto: text })}
          />
        )}
      </View>
    );
  };

  const renderUploadSection = () => (
    <View style={styles.uploadSection}>
      <Text style={styles.sectionTitle}>Document Upload</Text>
      
      <TouchableOpacity
        style={styles.downloadButton}
        onPress={handleDownloadForm}
      >
        <Ionicons name="download" size={20} color="white" />
        <Text style={styles.downloadButtonText}>Download Nomination Form</Text>
      </TouchableOpacity>

      <Text style={styles.uploadInstructions}>
        1. Download and print the form{"\n"}
        2. Fill in all required details{"\n"}
        3. Scan and upload the signed copy
      </Text>

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={handleFileUpload}
        disabled={isSubmitting}
      >
        <Ionicons name="cloud-upload" size={24} color="#007AFF" />
        <Text style={styles.uploadButtonText}>
          {uploadedFile ? uploadedFile.name : 'Upload Signed PDF Form'}
        </Text>
      </TouchableOpacity>

      {uploadedFile && (
        <Text style={styles.uploadSuccessText}>
          ✓ File uploaded successfully
        </Text>
      )}
    </View>
  );

  return (
    <>
      <Modal visible={disclaimerVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nomination Disclaimer</Text>
            <Text style={styles.modalText}>
              By proceeding, you agree that all information provided is accurate and complete. 
              False information may result in disqualification.
            </Text>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => setDisclaimerVisible(false)}
            >
              <Text style={styles.acceptButtonText}>Accept & Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Nomination Form</Text>
          <Menu
            visible={isMenuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity onPress={() => setMenuVisible(true)}>
                <Ionicons name="ellipsis-vertical" size={24} color="#000" />
              </TouchableOpacity>
            }>
            <Menu.Item 
              onPress={() => {
                setMenuVisible(false);
                showInstructions();
              }} 
              title="Instructions" 
            />
          </Menu>
        </View>

        {currentSection < 3 ? (
          renderFormSection(
            formSections[currentSection],
            [candidate, proposer, seconder][currentSection],
            [setCandidate, setProposer, setSeconder][currentSection],
            [candidateImage, proposerImage, seconderImage][currentSection],
            [setCandidateImage, setProposerImage, setSeconderImage][currentSection]
          )
        ) : (
          renderUploadSection()
        )}

        <View style={styles.navigationButtons}>
          {currentSection > 0 && (
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton]}
              onPress={goToPreviousSection}
              disabled={isSubmitting}
            >
              <Ionicons name="arrow-back" size={20} color="white" />
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>
          )}

          {currentSection === formSections.length - 1 ? (
            <TouchableOpacity
              style={[styles.navButton, styles.submitButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.navButtonText}>
                {isSubmitting ? "Submitting..." : "Submit Nomination"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={goToNextSection}
              disabled={isSubmitting}
            >
              <Text style={styles.navButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
   downloadButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  downloadButtonText: {
    color: 'white',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  container: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1a1a1a',
  },
  imageUploadContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  uploadImagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  inputText: {
    color: '#000',
  },
  placeholderText: {
    color: '#666',
  },
  yesnoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  yesnoLabel: {
    fontSize: 16,
    flex: 1,
  },
  yesnoButtonGroup: {
    flexDirection: 'row',
    gap: 20,
  },
  yesnoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  yesnoSelected: {
    // Add any specific selected styles
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  categoryButton: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  categorySelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryText: {
    color: '#666',
  },
  categoryTextSelected: {
    color: 'white',
  },
  errorText: {
    color: 'red',
    marginBottom: 5,
  },
  eligibilityError: {
    color: 'red',
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#ffecec',
    borderRadius: 5,
  },
  manifestoInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    marginBottom: 20,
  },
  acceptButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  prevButton: {
    backgroundColor: '#666',
  },
  nextButton: {
    backgroundColor: '#007AFF',
  },
  submitButton: {
    backgroundColor: '#28a745',
  },
  navButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  uploadSection: {
    marginTop: 20,
  },
  downloadButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 10,
    marginBottom: 20,
  },
  downloadButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  uploadInstructions: {
    marginBottom: 20,
    color: '#666',
    lineHeight: 24,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  uploadButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  uploadSuccessText: {
    color: '#28a745',
    marginTop: 10,
  },
});