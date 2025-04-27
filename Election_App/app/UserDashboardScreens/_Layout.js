export default function DashboardLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Dashboard" }} />
      <Stack.Screen name="profile" options={{ title: "Profile" }} />
      <Stack.Screen name="helpdesk" options={{ title: "Help Desk" }} />
      <Stack.Screen name="Images" options={{ title: "Images" }} />
      <Stack.Screen name="ImageUpload" options={{ title: "Upload Photo" }} />
      <Stack.Screen name="nominations" options={{ title: "Nominations" }} />
      <Stack.Screen name="vote" options={{ title: "Vote" }} />
      <Stack.Screen name="ApprovedCandidatesScreen" options={{ title: "Approved Candidates" }} />
    </Stack>
  );
}