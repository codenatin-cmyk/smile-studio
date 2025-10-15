import { Stack, Redirect } from 'expo-router';
import { useSession } from '@/lib/SessionContext';

export default function AuthLayout() {
  const { isAuthenticated,role, isLoading } = useSession();

  // Show nothing until loading finishes
  //if (isLoading) return null;

  // Redirect authenticated users to account page
  
  if (isAuthenticated) {
    switch(role){
    case "admin":
      return <Redirect href={"/(protected)/accAdmin"} />
    case "clinic":
      return <Redirect href={"/(protected)/accClinic"} />
    case "patient":
      return <Redirect href={"/(protected)/account"} />
  }
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="signupPatient" />
      <Stack.Screen name="signupClinic" />
    </Stack>
  );
}
