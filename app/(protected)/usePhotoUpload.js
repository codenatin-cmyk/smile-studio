import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from './supabaseClient';

export const usePhotoUpload = () => {
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access media library is required!');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio for profile photos
      quality: 0.8,
    });

    if (!result.canceled) {
      return result.assets[0];
    }
    return null;
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access camera is required!');
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      return result.assets[0];
    }
    return null;
  };

  const uploadPhoto = async (imageUri, userId) => {
    try {
      setUploading(true);

      // Create unique filename
      const fileExt = imageUri.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      
      // Read file as base64
      const fileBase64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert to blob-like format
      const arrayBuffer = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('avatars') // Make sure this bucket exists in Supabase
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return {
        path: data.path,
        publicUrl: publicData.publicUrl,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return {
    pickImage,
    takePhoto,
    uploadPhoto,
    uploading,
  };
};