// app/_layout.tsx (or Layout.tsx, depending on Expo Router version)
import { SessionProvider, useSession } from '@/lib/SessionContext';
import { Redirect, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  const {session, isLoading,role, isAuthenticated} = useSession();

  useEffect(() => {
      SplashScreen.hideAsync();
  }, []);

  if(isAuthenticated){
    return <Redirect href={"/login"}/>
  }

  return (
    <SessionProvider>
      <Stack 
        screenOptions={{
          headerShown: false,
        }}
      > 
        <Stack.Screen name='(protected)'/>
        <Stack.Screen name='index'/>
        <Stack.Screen name='(auth)'/>   
      </Stack>
    </SessionProvider>
  );
} //const {isAuthenticated} = useSession();