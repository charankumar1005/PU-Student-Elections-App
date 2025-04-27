import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Image,ScrollView
} from "react-native";

import { Overlay } from "@rneui/themed";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
const API_URL="http://192.168.151.139:5000";
const Candidates = () => {
  const [nominations, setNominations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNomination, setSelectedNomination] = useState(null);
  const [activeSection, setActiveSection] = useState("Candidate");

  useFocusEffect(
    React.useCallback(() => {
      fetchNominations();
    }, [])
  );

  const fetchNominations = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const userDetails = await AsyncStorage.getItem("userDetails");
      const user = JSON.parse(userDetails);

      if (!token) {
        Alert.alert("Auth Error", "Admin token not found");
        return;
      }

      const res = await fetch(
        "http://192.168.151.139:5000/api/nominations?groupBy=department",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const json = await res.json();

      if (!json.success) {
        throw new Error(json.message || "Failed to fetch nominations");
      }

      const formattedData = json.data.map((section) => ({
        title: section.department,
        data: section.nominations.map((n) => ({
          ...n,
          name: n.candidate?.name || "N/A",
          email: n.user?.email || "N/A",
          department: section.department,
          status: n.status,
          createdAt: n.createdAt,
          document: n.document,
          candidate: {
            ...n.candidate,
            image: n.candidate?.image ? `http://192.168.151.139:5000/${n.candidate.image}` : null,
          },
          proposer: {
            ...n.proposer,
            image: n.proposer?.image ? `http://192.168.151.139:5000/${n.proposer.image}` : null,
          },
          seconder: {
            ...n.seconder,
            image: n.seconder?.image ? `http://192.168.151.139:5000/${n.seconder.image}` : null,
          },
          _id: n._id,
        })),
      }));

      setNominations(formattedData);
    } catch (err) {
      console.error("❌ Error fetching nominations:", err);
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = await AsyncStorage.getItem("userToken");

      let url = `http://192.168.151.139:5000/nominations/${id}`;
      let method = "DELETE";

      if (status === "approved") {
        url = `http://192.168.151.139:5000/nominations/${id}/approve`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error("Invalid response from server");
      }

      if (data.success) {
        Alert.alert("Success", `Nomination ${status}`);
        setSelectedNomination(null);
        fetchNominations();
      } else {
        throw new Error(data.message || "Status update failed");
      }
    } catch (err) {
      Alert.alert("Error", err.message);
      console.error("🔥 Update Status Error:", err);
    }
  };

  const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>
        {typeof value === "boolean" ? (value ? "Yes" : "No") : value ?? "N/A"}
      </Text>
    </View>
  );

  const renderDetailSection = (section, data) => {
    const getSectionData = () => {
      switch (section) {
        case "Candidate":
          return {
            title: "🎓 Candidate",
            image: data.candidate?.image,
            fields: [
              { label: "Name", value: data.candidate?.name },
              { label: "Reg No", value: data.candidate?.regNo },
              { label: "Program", value: data.candidate?.programName },
              { label: "Age", value: data.candidate?.age },
              { label: "DOB", value: data.candidate?.dob },
              { label: "Gender", value: data.candidate?.gender },
              { label: "Admission Year", value: data.candidate?.admissionYear },
              { label: "Category", value: data.candidate?.category },
              { label: "Full Time Student", value: data.candidate?.fullTimeStudent },
              { label: "Has Arrears", value: data.candidate?.hasArrears },
              { label: "Attendance", value: data.candidate?.attendance },
              { label: "Criminal Acts", value: data.candidate?.hasCriminalProceedings },
              { label: "Disciplinary Actions", value: data.candidate?.hasDisciplinaryActions },
              { label: "Manifesto", value: data.candidate?.manifesto },
            ]
          };
        case "Proposer":
          return {
            title: "🧍‍♂️ Proposer",
            image: data.proposer?.image,
            fields: [
              { label: "Name", value: data.proposer?.name },
              { label: "Reg No", value: data.proposer?.regNo },
              { label: "Program", value: data.proposer?.programName },
              { label: "Age", value: data.proposer?.age },
              { label: "DOB", value: data.proposer?.dob },
              { label: "Gender", value: data.proposer?.gender },
              { label: "Admission Year", value: data.proposer?.admissionYear },
              { label: "Category", value: data.proposer?.category },
              { label: "Full Time Student", value: data.proposer?.fullTimeStudent },
              { label: "Has Arrears", value: data.proposer?.hasArrears },
              { label: "Attendance", value: data.proposer?.attendance },
              { label: "Criminal Acts", value: data.proposer?.hasCriminalProceedings },
              { label: "Disciplinary Actions", value: data.proposer?.hasDisciplinaryActions },
            ]
          };
        case "Seconder":
          return {
            title: "🧍‍♂️ Seconder",
            image: data.seconder?.image,
            fields: [
              { label: "Name", value: data.seconder?.name },
              { label: "Reg No", value: data.seconder?.regNo },
              { label: "Program", value: data.seconder?.programName },
              { label: "Age", value: data.seconder?.age },
              { label: "DOB", value: data.seconder?.dob },
              { label: "Gender", value: data.seconder?.gender },
              { label: "Admission Year", value: data.seconder?.admissionYear },
              { label: "Category", value: data.seconder?.category },
              { label: "Full Time Student", value: data.seconder?.fullTimeStudent },
              { label: "Has Arrears", value: data.seconder?.hasArrears },
              { label: "Attendance", value: data.seconder?.attendance },
              { label: "Criminal Acts", value: data.seconder?.hasCriminalProceedings },
              { label: "Disciplinary Actions", value: data.seconder?.hasDisciplinaryActions },
            ]
          };
        default:
          return { title: "", image: null, fields: [] };
      }
    };

    const sectionData = getSectionData();

    return (
      <>
        <View style={styles.imageContainer}>
          {sectionData.image ? (
            <Image
              source={{ uri: sectionData.image }}
              style={styles.roleImage}
              resizeMode="cover"
              onError={(e) => console.log("Image load error:", e.nativeEvent.error)}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
          <Text style={styles.imageLabel}>{section} Photo</Text>
        </View>

        <Text style={styles.subTitle}>{sectionData.title}</Text>
        {sectionData.fields.map((field, index) => (
          <DetailRow key={index} label={field.label} value={field.value} />
        ))}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Nomination Forms</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />
      ) : nominations.length === 0 ? (
        <Text style={styles.emptyText}>No Nominations were uploaded.</Text>
      ) : (
        <SectionList
          sections={nominations}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => setSelectedNomination(item)}
            >
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.itemText}>Status: {item.status}</Text>
            </TouchableOpacity>
          )}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
          )}
        />
      )}

         <Overlay
        isVisible={!!selectedNomination}
        onBackdropPress={() => setSelectedNomination(null)}
        overlayStyle={styles.overlay}
      >
        {selectedNomination && (
          <View style={styles.overlayContainer}>
            <Text style={styles.modalTitle}>Nomination Details</Text>

            <View style={styles.sectionTabs}>
              {['Candidate', 'Proposer', 'Seconder'].map((section) => (
                <TouchableOpacity
                  key={section}
                  style={[
                    styles.sectionTab,
                    activeSection === section && styles.activeSectionTab
                  ]}
                  onPress={() => setActiveSection(section)}
                >
                  <Text style={[
                    styles.sectionTabText,
                    activeSection === section && styles.activeSectionTabText
                  ]}>
                    {section}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {renderDetailSection(activeSection, selectedNomination)}

              {activeSection === "Seconder" && (
                <>
                  <Text style={styles.subTitle}>📄 Uploaded Form</Text>
                  {selectedNomination.document ? (
                        <TouchableOpacity
      onPress={async () => {
        const fileUrl = `${API_URL}/${selectedNomination.document}`;
        try {
          const supported = await Linking.canOpenURL(fileUrl);
          if (supported) {
            await Linking.openURL(fileUrl);
          } else {
            Alert.alert('Error', 'Cannot open the file URL.');
          }
        } catch (err) {
          console.error('Failed to open URL:', err);
          Alert.alert('Error', 'Something went wrong while opening the file.');
        }
      }}
    >
      <Text style={styles.documentLink}>
        Download Nomination Form
      </Text>
    </TouchableOpacity>
                  ) : (
                    <Text style={styles.detailValue}>No form uploaded</Text>
                  )}
                  <DetailRow label="Status" value={selectedNomination.status} />
                  <DetailRow
                    label="Submitted At"
                    value={new Date(selectedNomination.createdAt).toLocaleString()}
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.bottomActions}>
              {activeSection === "Seconder" && (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.statusButton, { backgroundColor: "green" }]}
                    onPress={() => updateStatus(selectedNomination._id, "approved")}
                  >
                    <Text style={styles.buttonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusButton, { backgroundColor: "crimson" }]}
                    onPress={() => updateStatus(selectedNomination._id, "rejected")}
                  >
                    <Text style={styles.buttonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedNomination(null)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Overlay>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    padding: 16,
  },
  header: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  sectionHeader: {
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  sectionHeaderText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  item: {
    backgroundColor: "#222",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  title: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  itemText: {
    color: "#ccc",
    fontSize: 14,
  },
  emptyText: {
    color: "#ccc",
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
  overlay: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    height: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  subTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#eee",
    marginTop: 10,
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  detailLabel: {
    fontWeight: "600",
    color: "#aaa",
    width: 110,
  },
  detailValue: {
    color: "#fff",
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  statusButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 6,
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: "#444",
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  roleImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#fff',
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#666',
  },
  placeholderText: {
    color: '#888',
    fontSize: 14,
  },
  imageLabel: {
    color: '#fff',
    marginTop: 5,
    fontSize: 12,
  },
  sectionTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  sectionTab: {
    padding: 8,
    borderRadius: 8,
  },
  activeSectionTab: {
    backgroundColor: '#007AFF',
  },
  sectionTabText: {
    color: '#aaa',
    fontWeight: 'bold',
  },
  activeSectionTabText: {
    color: '#fff',
  },
  documentLink: {
    color: "skyblue",
    marginBottom: 8,
    textDecorationLine: 'underline',
  },
  overlayContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    marginBottom: 10,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  bottomActions: {
    marginTop: 'auto', // Pushes actions to bottom
  },
});

export default Candidates;