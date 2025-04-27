import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
} from "react-native";
import { Overlay } from "react-native-elements";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import io from "socket.io-client";

const socket = io("http://192.168.151.139:3000");

const TicketsScreen = () => {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchTickets();

    socket.on("new-ticket", handleNewTicket);
    socket.on("ticket-updated", handleTicketUpdate);
    socket.on("error", handleSocketError);

    return () => {
      socket.off("new-ticket", handleNewTicket);
      socket.off("ticket-updated", handleTicketUpdate);
      socket.off("error", handleSocketError);
    };
  }, [filter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        router.replace("/screens/login");
        return;
      }

      const query = filter !== "all" ? `?status=${filter}` : "";
      const response = await fetch(
        `http://192.168.151.139:3000/api/helpdesk/tickets${query}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch tickets");
      const data = await response.json();
      setTickets(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewTicket = (newTicket) => {
    setTickets((prev) => [...prev, newTicket]);
  };

  const handleTicketUpdate = (updatedTicket) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket._id === updatedTicket._id ? updatedTicket : ticket
      )
    );
  };

  const handleSocketError = () => {
    Alert.alert("Connection Error", "Real-time updates disconnected");
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch(
        `http://192.168.151.139:3000/api/helpdesk/tickets/${ticketId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) throw new Error("Failed to update ticket");

      const updatedTicket = await response.json();
      handleTicketUpdate(updatedTicket);
      socket.emit("ticket-updated", updatedTicket);
      setSelectedTicket(null);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderTicketItem = ({ item }) => (
    <TouchableOpacity
      style={styles.ticketItem}
      onPress={() => setSelectedTicket(item)}
    >
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketTitle}>{item.category}</Text>
        <Text
          style={[
            styles.ticketStatus,
            item.status === "open" ? styles.statusOpen : styles.statusClosed,
          ]}
        >
          {item.status.toUpperCase()}
        </Text>
      </View>
      <Text numberOfLines={1} style={styles.ticketDescription}>
        {item.description}
      </Text>
      <Text style={styles.ticketDate}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const renderTicketDetails = () => (
    <Overlay
      isVisible={!!selectedTicket}
      onBackdropPress={() => setSelectedTicket(null)}
      overlayStyle={styles.overlay}
    >
      {selectedTicket && (
        <View>
          <Text style={styles.detailTitle}>Ticket Details</Text>
          <DetailRow label="Name" value={selectedTicket.name} />
          <DetailRow label="Email" value={selectedTicket.email} />
          <DetailRow label="Student Type" value={selectedTicket.studentType} />
          <DetailRow label="Department" value={selectedTicket.department} />
          <DetailRow label="Course" value={selectedTicket.course} />
          <DetailRow label="Description" value={selectedTicket.description} />
          <DetailRow label="Status" value={selectedTicket.status} />
          <DetailRow
            label="Created At"
            value={new Date(selectedTicket.createdAt).toLocaleString()}
          />

          <View style={styles.statusButtons}>
            {selectedTicket.status === "open" && (
              <TouchableOpacity
                style={[styles.statusButton, styles.resolveButton]}
                onPress={() => updateTicketStatus(selectedTicket._id, "closed")}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Mark as Resolved</Text>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.statusButton, styles.closeButton]}
              onPress={() => setSelectedTicket(null)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Overlay>
  );

  const DetailRow = ({ label, value }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      {["all", "open", "closed"].map((f) => (
        <TouchableOpacity
          key={f}
          style={[
            styles.filterButton,
            filter === f && styles.activeFilterButton,
          ]}
          onPress={() => setFilter(f)}
        >
          <Text
            style={[
              styles.filterText,
              filter === f && styles.activeFilterText,
            ]}
          >
            {f.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderFilterButtons()}

      <SectionList
        sections={[{ title: "Tickets", data: tickets }]}
        keyExtractor={(item) => item._id}
        renderItem={renderTicketItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {loading ? (
              <ActivityIndicator size="large" />
            ) : (
              <Text style={styles.emptyText}>
                {error || "No tickets found"}
              </Text>
            )}
          </View>
        }
      />
      {renderTicketDetails()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1e1e",
  },
  ticketItem: {
    backgroundColor: "#2a2a2a",
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    borderRadius: 10,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  ticketTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  ticketStatus: {
    fontSize: 14,
    fontWeight: "bold",
  },
  statusOpen: {
    color: "#4CAF50",
  },
  statusClosed: {
    color: "#F44336",
  },
  ticketDescription: {
    color: "#888",
    marginBottom: 5,
  },
  ticketDate: {
    color: "#666",
    fontSize: 12,
  },
  overlay: {
    backgroundColor: "#2a2a2a",
    padding: 20,
    borderRadius: 10,
    width: "90%",
  },
  detailTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  detailLabel: {
    color: "white",
    fontWeight: "bold",
    width: 100,
  },
  detailValue: {
    color: "white",
    flex: 1,
  },
  statusButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  statusButton: {
    padding: 10,
    borderRadius: 5,
    minWidth: 120,
    alignItems: "center",
  },
  resolveButton: {
    backgroundColor: "#4CAF50",
  },
  closeButton: {
    backgroundColor: "#F44336",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "#2a2a2a",
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#888",
  },
  activeFilterButton: {
    borderColor: "#4CAF50",
    backgroundColor: "#333",
  },
  filterText: {
    color: "#888",
  },
  activeFilterText: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
});

export default TicketsScreen;
