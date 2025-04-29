import { Stack } from "expo-router";
import { PaperProvider, DefaultTheme, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? MD3DarkTheme : DefaultTheme;

  return (
    <PaperProvider theme={theme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="UserDashboardScreens/login" options={{ headerShown: false }} />
        <Stack.Screen name="UserDashboardScreens/register" options={{ headerShown: false }} />
        <Stack.Screen name="AdminScreens/AdminDashboard" options={{ headerShown: false }} />
        <Stack.Screen name="UserDashboardScreens/vote" options={{ headerShown: false }} />
        {/* <Stack.Screen name="screens/results" options={{ headerShown: false }} /> */}
        <Stack.Screen name="UserDashboardScreens/notifications" options={{ headerShown: false }} />
        <Stack.Screen name="UserDashboardScreens/helpdesk" options={{ headerShown: false }} />
        <Stack.Screen name="UserDashboardScreens/DashboardScreen" options={{ headerShown: false }} />
        <Stack.Screen name="UserDashboardScreens/nominations" options={{ headerShown: false }} />
        <Stack.Screen name="UserDashboardScreens/ProfileScreen" options={{ headerShown: false }} />
        <Stack.Screen name="AdminScreens/candidates" options={{ headerShown: false }} />
        <Stack.Screen name="AdminScreens/ApprovedCandidatesScreen" options={{ headerShown: false }} />
        <Stack.Screen name="UserDashboardScreens/ImageUpload" options={{ headerShown: false }} />
        <Stack.Screen name="AdminScreens/tickets" options={{ headerShown: false }} />
        <Stack.Screen name="UserDashboardScreens/Instructions" options={{ headerShown: false }} />
        <Stack.Screen name="UserDashboardScreens/Images" options={{ headerShown: false }} />
        <Stack.Screen name="UserDashboardScreens/NominationStatus" options={{ headerShown: false }} />
        <Stack.Screen name="UserDashboardScreens/UserApprovedCandidatesScreen" options={{ headerShown: false }} />
        <Stack.Screen name="AdminScreens/VotesList" options={{ headerShown: false }} />
        <Stack.Screen name="AdminScreens/TicketScreen" options={{ headerShown: false }} />
       <Stack.Screen name="UserDashboardScreens/viewVotes" options={{ headerShown: false }} />
       <Stack.Screen name="AdminScreens/DisplyVotes" options={{ headerShown: false }} />
       <Stack.Screen name="AdminScreens/VotesByDepartment" options={{ headerShown: false }} />
       <Stack.Screen name="UserDashboardScreens/DepartmentVotesScreen" options={{ headerShown: false }} />
        <Stack.Screen name="AdminScreens/CandidateDetails" options={{ headerShown: false }} />
        <Stack.Screen name="UserDashboardScreens/FinalResultsScreen" options={{ headerShown: false }} />
         <Stack.Screen name="AdminScreens/UserManagementDashboard" options={{ headerShown: false }} />
           <Stack.Screen name="UserDashboardScreens/ContactUs" options={{ headerShown: false }} />
      </Stack>
    </PaperProvider>
  );
}
