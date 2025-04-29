// import React, { useState, useEffect } from "react";
// import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { Card, Title, Paragraph, Surface } from "react-native-paper";
// import { schoolsAndDepartments } from "../data/data";
// import { BarChart } from "react-native-chart-kit";
// import { Dimensions } from "react-native";

// const screenWidth = Dimensions.get("window").width;

// const VotesByDepartment = () => {
//   const [votesData, setVotesData] = useState([]);
//   const [selectedDepartment, setSelectedDepartment] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const fetchVotes = async () => {
//     try {
//       const token = await AsyncStorage.getItem("userToken");
//       const response = await fetch("http://192.168.151.139:5000/api/votes", {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const json = await response.json();

//       if (json.success) {
//         setVotesData(json.data);
//       }
//     } catch (err) {
//       console.error("Error fetching votes:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchVotes();
//   }, []);

//   const renderCandidate = ({ item }) => (
//     <Card style={styles.card}>
//       <View style={styles.cardContent}>
//         <Image source={{ uri: `http://192.168.151.139:5000/${item.imageUrl}` }} style={styles.image} />
//         <View style={styles.textContent}>
//           <Title style={styles.name}>{item.name}</Title>
//           <Paragraph style={styles.category}>{item.category}</Paragraph>
//           <Text style={styles.voteCount}>🗳️ {item.voteCount} votes</Text>
//         </View>
//       </View>
//     </Card>
//   );

//   const getCandidatesByDepartment = (department) => {
//     return votesData
//       .filter((v) => v.department === department)
//       .map((v) => ({
//         name: v.candidate?.name || "N/A",
//         department: v.department,
//         gender: v.candidate?.gender || "N/A",
//         age: v.candidate?.age || "N/A",
//         category: v.candidate?.category || "N/A",
//         programName: v.candidate?.programName || "N/A",
//         voteCount: v.voteCount || 0,
//         imageUrl: v.candidate?.image,
//       }));
//   };

//   const renderVoteChart = (candidates) => {
//     const labels = candidates.map((c) => c.name.length > 5 ? c.name.substring(0, 5) + ".." : c.name);
//     const data = candidates.map((c) => c.voteCount);

//     return (
//       <BarChart
//         data={{
//           labels,
//           datasets: [
//             {
//               data,
//             },
//           ],
//         }}
//         width={screenWidth - 32}
//         height={220}
//         yAxisLabel=""
//         chartConfig={{
//           backgroundColor: "#f0f4f8",
//           backgroundGradientFrom: "#E3F2FD",
//           backgroundGradientTo: "#90CAF9",
//           decimalPlaces: 0,
//           color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
//           labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
//           style: {
//             borderRadius: 16,
//           },
//           propsForDots: {
//             r: "6",
//             strokeWidth: "2",
//             stroke: "#007AFF",
//           },
//         }}
//         verticalLabelRotation={30}
//         style={{ marginTop: 10, borderRadius: 16 }}
//       />
//     );
//   };

//   if (loading) {
//     return (
//       <View style={styles.center}>
//         <ActivityIndicator size="large" color="#007AFF" />
//       </View>
//     );
//   }

//   return (
//     <ScrollView contentContainerStyle={styles.container}>
//       <Text style={styles.title}>📊 Votes by Department</Text>
//       {schoolsAndDepartments.map((school, idx) => (
//         <View key={idx}>
//           <Text style={styles.schoolTitle}>{school.name}</Text>
//           {school.departments.map((dept, deptIdx) => (
//             <TouchableOpacity
//               key={deptIdx}
//               style={[
//                 styles.departmentButton,
//                 selectedDepartment === dept && styles.selectedDept,
//               ]}
//               onPress={() =>
//                 setSelectedDepartment(
//                   selectedDepartment === dept ? null : dept
//                 )
//               }
//             >
//               <Text style={styles.departmentText}>{dept}</Text>
//             </TouchableOpacity>
//           ))}

//           {selectedDepartment &&
//             school.departments.includes(selectedDepartment) && (
//               <>
//                 {renderVoteChart(getCandidatesByDepartment(selectedDepartment))}
//                 <FlatList
//                   data={getCandidatesByDepartment(selectedDepartment)}
//                   renderItem={renderCandidate}
//                   keyExtractor={(item, index) => item.name + index}
//                   style={styles.candidateList}
//                 />
//               </>
//             )}
//         </View>
//       ))}
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     padding: 16,
//     paddingBottom: 60,
//     backgroundColor: "#f0f4f8",
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 20,
//     textAlign: "center",
//     color: "#333",
//   },
//   schoolTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     marginTop: 16,
//     marginBottom: 8,
//     color: "#222",
//   },
//   departmentButton: {
//     padding: 12,
//     backgroundColor: "#E3F2FD",
//     borderRadius: 10,
//     marginVertical: 6,
//     elevation: 1,
//   },
//   selectedDept: {
//     backgroundColor: "#90CAF9",
//   },
//   departmentText: {
//     color: "#000",
//     fontSize: 16,
//     fontWeight: "600",
//   },
//   card: {
//     marginVertical: 10,
//     backgroundColor: "#ffffff",
//     borderRadius: 12,
//     elevation: 3,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   cardContent: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 16,
//   },
//   image: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     marginRight: 16,
//     backgroundColor: "#eee",
//   },
//   textContent: {
//     flex: 1,
//   },
//   name: {
//     fontSize: 18,
//     fontWeight: "700",
//     color: "#333",
//   },
//   category: {
//     fontSize: 14,
//     color: "#666",
//   },
//   voteCount: {
//     fontSize: 16,
//     color: "#1E88E5",
//     marginTop: 4,
//   },
//   candidateList: {
//     marginTop: 10,
//   },
//   center: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
// });

// export default VotesByDepartment;
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BarChart,
  ProgressChart,
} from "react-native-chart-kit";
import { VictoryPie } from "victory-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Card, Title } from "react-native-paper";

const { width: screenWidth } = Dimensions.get("window");

const chartConfig = {
  backgroundColor: "#ffffff",
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 121, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: "#007AFF",
  },
};

const DashboardScreen = () => {
  const [votesData, setVotesData] = useState([]);
  const [selectedViz, setSelectedViz] = useState("overview");
  const [loading, setLoading] = useState(true);

  const fetchVotes = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch("http://192.168.151.139:5000/api/votes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      if (json.success) setVotesData(json.data);
    } catch (err) {
      console.error("Error fetching votes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVotes();
  }, []);

  // Data processing functions
  const getDepartmentData = () => {
    const departmentMap = new Map();
    votesData.forEach(({ department, voteCount }) => {
      departmentMap.set(department, (departmentMap.get(department) || 0) + voteCount);
    });
    return Array.from(departmentMap, ([name, votes]) => ({ name, votes }));
  };

  const getCategoryData = () => {
    const categoryMap = new Map();
    votesData.forEach(({ candidate }) => {
      const category = candidate?.category || "Unknown";
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    return Array.from(categoryMap, ([name, count]) => ({ name, count }));
  };

  const getGenderDistribution = () => {
    const genderData = { male: 0, female: 0, other: 0 };
    votesData.forEach(({ candidate }) => {
      const gender = candidate?.gender?.toLowerCase() || "other";
      genderData[gender] = (genderData[gender] || 0) + 1;
    });
    return genderData;
  };

  const renderVizSection = () => {
    switch (selectedViz) {
      case "department":
        return (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Votes by Department</Text>
            <View style={styles.departmentLabelsContainer}>
              {getDepartmentData().map((department, index) => (
                <View
                  key={index}
                  style={[
                    styles.departmentLabel,
                    { backgroundColor: departmentColors[index % departmentColors.length] },
                  ]}
                >
                  <Text style={styles.departmentLabelText}>{department.name}: {department.votes} votes</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case "category":
        return (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Candidate Categories</Text>
            <BarChart
              data={{
                labels: getCategoryData().map((d) => d.name),
                datasets: [{ data: getCategoryData().map((d) => d.count) }],
              }}
              width={screenWidth - 32}
              height={220}
              yAxisLabel=""
              chartConfig={chartConfig}
              verticalLabelRotation={30}
            />
          </View>
        );

      case "gender":
        const genderData = getGenderDistribution();
        return (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Gender Distribution</Text>
            <ProgressChart
              data={[
                genderData.male / votesData.length,
                genderData.female / votesData.length,
                genderData.other / votesData.length,
              ]}
              width={screenWidth - 32}
              height={220}
              chartConfig={{
                ...chartConfig,
                color: (opacity, index) => [
                  `rgba(30, 136, 229, ${opacity})`,
                  `rgba(255, 152, 0, ${opacity})`,
                  `rgba(76, 175, 80, ${opacity})`,
                ][index],
              }}
              hideLegend={false}
            />
            <View style={styles.genderLabelsContainer}>
              <Text style={[styles.genderLabel, { color: "#1e88e5" }]}>Male: {genderData.male}</Text>
              <Text style={[styles.genderLabel, { color: "#ff9800" }]}>Female: {genderData.female}</Text>
              <Text style={[styles.genderLabel, { color: "#4caf50" }]}>Other: {genderData.other}</Text>
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.gridContainer}>
            <TouchableOpacity
              style={styles.metricCard}
              onPress={() => setSelectedViz("department")}
            >
              <MaterialIcons name="school" size={24} color="#1E88E5" />
              <Text style={styles.metricValue}>{getDepartmentData().length}</Text>
              <Text style={styles.metricLabel}>Departments</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.metricCard}
              onPress={() => setSelectedViz("category")}
            >
              <MaterialIcons name="category" size={24} color="#FF9800" />
              <Text style={styles.metricValue}>{getCategoryData().length}</Text>
              <Text style={styles.metricLabel}>Categories</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.metricCard}
              onPress={() => setSelectedViz("gender")}
            >
              <MaterialIcons name="people" size={24} color="#4CAF50" />
              <Text style={styles.metricValue}>
                {Object.keys(getGenderDistribution()).length}
              </Text>
              <Text style={styles.metricLabel}>Gender Groups</Text>
            </TouchableOpacity>

            <View style={styles.metricCard}>
              <MaterialIcons name="how-to-vote" size={24} color="#E91E63" />
              <Text style={styles.metricValue}>
                {votesData.reduce((sum, item) => sum + item.voteCount, 0)}
              </Text>
              <Text style={styles.metricLabel}>Total Votes</Text>
              
            </View>
          </View>
        );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E88E5" />
        <Text style={styles.loadingText}>Crunching the numbers...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>📈 Election Analytics Dashboard</Text>

      <View style={styles.vizSelector}>
        <TouchableOpacity
          style={[styles.vizButton, selectedViz === "overview" && styles.activeViz]}
          onPress={() => setSelectedViz("overview")}
        >
          <Text style={styles.vizButtonText}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.vizButton, selectedViz === "department" && styles.activeViz]}
          onPress={() => setSelectedViz("department")}
        >
          <Text style={styles.vizButtonText}>Departments</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.vizButton, selectedViz === "category" && styles.activeViz]}
          onPress={() => setSelectedViz("category")}
        >
          <Text style={styles.vizButtonText}>Categories</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.vizButton, selectedViz === "gender" && styles.activeViz]}
          onPress={() => setSelectedViz("gender")}
        >
          <Text style={styles.vizButtonText}>Gender</Text>
        </TouchableOpacity>
      </View>

      {renderVizSection()}

      <Card style={styles.dataTable}>
        <Title style={styles.tableTitle}>Detailed Vote Breakdown</Title>
        <View style={styles.tableHeader}>
          <Text style={styles.headerCell}>Candidate</Text>
          <Text style={styles.headerCell}>Department</Text>
          <Text style={styles.headerCell}>Votes</Text>
        </View>
        {votesData.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.tableCell}>{item.candidate?.name || "N/A"}</Text>
            <Text style={styles.tableCell}>{item.department}</Text>
            <Text style={styles.tableCell}>{item.voteCount}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
};

const departmentColors = [
  "#1f77b4", // Blue
  "#ff7f0e", // Orange
  "#2ca02c", // Green
  "#d62728", // Red
  "#9467bd", // Purple
  "#8c564b", // Brown
];
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 20,
  },
  vizSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  vizButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#e9ecef",
  },
  activeViz: {
    backgroundColor: "#1E88E5",
  },
  vizButtonText: {
    color: "#2c3e50",
    fontWeight: "600",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  metricCard: {
    width: screenWidth / 2 - 24,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    elevation: 3,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2c3e50",
    marginVertical: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
  },
  chartContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 12,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#2c3e50",
  },
  dataTable: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "white",
    elevation: 3,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#2c3e50",
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerCell: {
    fontWeight: "700",
    color: "#2c3e50",
    width: "30%",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tableCell: {
    width: "30%",
    textAlign: "center",
    color: "#6c757d",
  },
  departmentLabelsContainer: {
    marginTop: 10,
  },
  departmentLabel: {
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  departmentLabelText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default DashboardScreen;
