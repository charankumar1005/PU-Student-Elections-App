import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  HelperText,
  Menu,
  Divider,
  useTheme
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HelpDeskScreen() {
  const theme = useTheme();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentType: '',
    department: '',
    course: '',
    description: ''
  });

  const [menuVisible, setMenuVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleSubmit = async () => {
    const { name, email, studentType, department, course, description } = formData;

    if (!name || !email || !studentType || !department || !course || !description) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Unauthorized', 'You must be logged in to submit a ticket.');
        return;
      }

      const response = await fetch('http://192.168.151.139:5000/api/helpdesk/submit-ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Submission failed');
      }

      Alert.alert('Success', 'Ticket submitted successfully!');
      setFormData({
        name: '',
        email: '',
        studentType: '',
        department: '',
        course: '',
        description: '',
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineMedium" style={styles.heading}>
          Raise Ticket
        </Text>

        <TextInput
          label="Full Name"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Email Address"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          style={styles.input}
          keyboardType="email-address"
          mode="outlined"
        />
        <HelperText type="error" visible={formData.email !== '' && !/\S+@\S+\.\S+/.test(formData.email)}>
          Email address is invalid!
        </HelperText>

        <View style={styles.menuWrapper}>
          <Menu
            visible={menuVisible}
            onDismiss={closeMenu}
            anchor={
              <Button
                mode="outlined"
                onPress={openMenu}
                style={styles.dropdown}
                contentStyle={{ justifyContent: 'flex-start' }}
              >
                {formData.studentType || 'Select Student Type'}
              </Button>
            }
          >
            <Menu.Item onPress={() => { setFormData({ ...formData, studentType: 'UG' }); closeMenu(); }} title="Undergraduate (UG)" />
            <Menu.Item onPress={() => { setFormData({ ...formData, studentType: 'PG' }); closeMenu(); }} title="Postgraduate (PG)" />
            <Menu.Item onPress={() => { setFormData({ ...formData, studentType: 'Scholar' }); closeMenu(); }} title="Research Scholar" />
          </Menu>
        </View>

        <TextInput
          label="Department"
          value={formData.department}
          onChangeText={(text) => setFormData({ ...formData, department: text })}
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Course"
          value={formData.course}
          onChangeText={(text) => setFormData({ ...formData, course: text })}
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Describe your issue"
          value={formData.description}
          onChangeText={(text) => setFormData({ ...formData, description: text })}
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={5}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.button}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#f9f9fb',
  },
  heading: {
    textAlign: 'center',
    marginBottom: 25,
    fontWeight: '700',
    color: '#2c3e50',
  },
  input: {
    marginBottom: 15,
    backgroundColor: 'black',
    
  },
  dropdown: {
    width: '100%',
    backgroundColor: '#fff',
  },
  menuWrapper: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#007aff',
  },
});
