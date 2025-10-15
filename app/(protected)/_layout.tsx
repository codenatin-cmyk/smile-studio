// app/_layout.tsx (or Layout.tsx, depending on Expo Router version)
import { SessionProvider, useSession } from '@/lib/SessionContext';
import { Redirect, Stack } from 'expo-router';
import 'mapbox-gl/dist/mapbox-gl.css';


export default function RootLayout() {

  const {isAuthenticated} = useSession();

   if(!isAuthenticated){
    return <Redirect href='/login'/> 
  }

  return (
    <Stack 
        screenOptions={{
          headerShown: false,
        }}
      > 
        <Stack.Screen name='account'/>
        <Stack.Screen name='accAdmin'/>
        <Stack.Screen name='accClinic'/>
     </Stack>
  );
}