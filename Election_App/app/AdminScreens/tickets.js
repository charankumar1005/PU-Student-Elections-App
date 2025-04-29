import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const socket = io('http://192.168.151.139:5000'); // Replace with your backend IP

export default function TicketsScreen() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState(null); // 👉 for expanding ticket details

  useEffect(() => {
    fetchTickets();

    socket.on('new-ticket', (newTicket) => {
      setTickets((prev) => [newTicket, ...prev]);
    });

    return () => socket.off('new-ticket');
  }, []);

  const fetchTickets = async () => {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      console.error('No token found');
      return;
    }

    try {
      const response = await fetch('http://192.168.151.139:5000/api/tickets', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Tickets fetched:', data.tickets);
        setTickets(data.tickets);
      } else {
        console.error('Failed to fetch tickets:', data.error);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterTickets();
  }, [searchTerm, selectedStatus, tickets]);

  const filterTickets = () => {
    let result = tickets;

    if (selectedStatus !== 'All') {
      result = result.filter((ticket) => ticket.status === selectedStatus);
    }

    if (searchTerm.trim() !== '') {
      result = result.filter(
        (ticket) =>
          ticket.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTickets(result);
  };

  const markTicketAsSeen = async (ticketId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await fetch(`http://192.168.151.139:5000/api/helpdesk/tickets/${ticketId}/admin-seen`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket._id === ticketId ? { ...ticket, seenByAdmin: true } : ticket
        )
      );
    } catch (err) {
      console.error('Error marking ticket as seen:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  };

  const toggleExpandTicket = async (ticketId) => {
    await markTicketAsSeen(ticketId);
    setExpandedTicketId((prev) => (prev === ticketId ? null : ticketId)); // toggle expand/collapse
  };

  const renderTicket = ({ item }) => (
    <TouchableOpacity
      onPress={() => toggleExpandTicket(item._id)}
      style={styles.ticketContainer}
    >
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketSubject}>{item.subject}</Text>
        {!item.seenByAdmin && <Text style={styles.newBadge}>New</Text>}
      </View>
      <Text style={styles.ticketInfo}>
        {item.userId?.name} — {item.userId?.department}
      </Text>

      <Text
        style={[
          styles.ticketStatus,
          {
            color: item.status === 'Resolved' ? 'green' : 'orange',
          },
        ]}
      >
        {item.status}
      </Text>
      <Text style={styles.ticketDate}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>

      {expandedTicketId === item._id && (
        <View style={styles.ticketDetailContainer}>
          <Text style={styles.detailText}><Text style={styles.detailLabel}>Ticket ID:</Text> {item._id}</Text>
          <Text style={styles.detailText}><Text style={styles.detailLabel}>Description:</Text> {item.description || 'No description provided.'}</Text>
          <Text style={styles.detailText}><Text style={styles.detailLabel}>Email:</Text> {item.userId?.email || 'N/A'}</Text>
          <Text style={styles.detailText}><Text style={styles.detailLabel}>Phone:</Text> {item.userId?.phone || 'N/A'}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const FilterButton = ({ label }) => (
    <TouchableOpacity
      onPress={() => setSelectedStatus(label)}
      style={[
        styles.filterButton,
        selectedStatus === label && styles.activeFilterButton,
      ]}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedStatus === label && styles.activeFilterButtonText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Help Desk Tickets</Text>

      <TextInput
        placeholder="Search by name or subject..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        style={styles.searchInput}
      />

      <View style={styles.filterContainer}>
        {['All', 'Pending', 'Resolved'].map((status) => (
          <FilterButton key={status} label={status} />
        ))}
      </View>

      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => item._id}
        renderItem={renderTicket}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={<Text style={styles.emptyText}>No tickets found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  searchInput: {
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 8,
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterButton: {
    marginRight: 10,
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  activeFilterButton: {
    backgroundColor: '#007bff',
  },
  filterButtonText: {
    color: '#333',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  ticketContainer: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  newBadge: {
    backgroundColor: '#ff5733',
    color: '#fff',
    padding: 4,
    borderRadius: 4,
  },
  ticketInfo: {
    fontSize: 14,
    color: '#555',
  },
  ticketStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  ticketDate: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  ticketDetailContainer: {
    marginTop: 10,
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 8,
  },
  detailText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  detailLabel: {
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#777',
  },
});
