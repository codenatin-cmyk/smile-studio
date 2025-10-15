import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

export default function FlashScreen() {
  return (
    <LinearGradient colors={['#003a3aff', '#2f4f2fff']} style={styles.container}>
      <View style={styles.centerContent}>
        <Text style={styles.title}>SMILE STUDIO</Text>
        <StatusBar style="light" />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 60 : 100,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffffff',
    letterSpacing: 2,
  },
});
