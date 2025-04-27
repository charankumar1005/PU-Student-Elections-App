import React from 'react';
import { View, Linking, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Avatar, Title, Paragraph, Divider } from 'react-native-paper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function ContactUsScreen() {
  const admin = {
    name: 'GUDE CHARAN KUMAR',
    email: 'charankumar5875@gmail.com',
    phone: '+91 93924 93153',
    role: 'Admin & Developer',
  };

  const handleEmail = () => Linking.openURL(`mailto:${admin.email}`);
  const handlePhone = () => Linking.openURL(`tel:${admin.phone}`);

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
       <Card.Title
  title={admin.name}
  subtitle={admin.role}
  titleStyle={styles.title}
  subtitleStyle={styles.subtitle}
  left={(props) => <Avatar.Icon {...props} icon="account-circle" />}
/>

        <Divider style={styles.divider} />
        <Card.Content>
          <Title style={styles.sectionTitle}>Contact Information</Title>

          <View style={styles.infoRow}>
            <MaterialIcons name="email" size={22} color="#333" />
            <Text style={styles.infoText} onPress={handleEmail}>
              {admin.email}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call" size={22} color="#333" />
            <Text style={styles.infoText} onPress={handlePhone}>
              {admin.phone}
            </Text>
          </View>

          <Divider style={styles.divider} />

          <Paragraph style={styles.note}>
            Feel free to reach out for any technical support or questions related to the Student Council Elections App.
          </Paragraph>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f2f2f2',
  },
  card: {
    borderRadius: 16,
    elevation: 4,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  divider: {
    marginVertical: 10,
    backgroundColor: '#ccc',
  },
  sectionTitle: {
    marginBottom: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#007bff',
    textDecorationLine: 'underline',
  },
  note: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
  },
   title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 2,
  },
});
