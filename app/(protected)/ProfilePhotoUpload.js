import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { usePhotoUpload } from './usePhotoUpload';
import { supabase } from './supabaseClient';

const ProfilePhotoUpload = ({ userId, currentPhotoUrl, onPhotoUpdated }) => {
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl);
  const { pickImage, takePhoto, uploadPhoto, uploading } = usePhotoUpload();

  const showImagePicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        handleActionSheet
      );
    } else {
      Alert.alert(
        'Select Photo',
        'Choose how you want to select a photo',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: handleTakePhoto },
          { text: 'Choose from Library', onPress: handlePickImage },
        ]
      );
    }
  };

  const handleActionSheet = (buttonIndex) => {
    if (buttonIndex === 1) {
      handleTakePhoto();
    } else if (buttonIndex === 2) {
      handlePickImage();
    }
  };

  const handlePickImage = async () => {
    try {
      const image = await pickImage();
      if (image) {
        await handleUpload(image.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const image = await takePhoto();
      if (image) {
        await handleUpload(image.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleUpload = async (imageUri) => {
    try {
      const result = await uploadPhoto(imageUri, userId);
      
      // Update user profile in database
      const { error: updateError } = await supabase
        .from('profiles') // Adjust table name as needed
        .update({ 
          avatar_url: result.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      setPhotoUrl(result.publicUrl);
      onPhotoUpdated && onPhotoUpdated(result.publicUrl);
      
      Alert.alert('Success', 'Photo uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.photoContainer} 
        onPress={showImagePicker}
        disabled={uploading}
      >
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              {uploading ? 'Uploading...' : 'Tap to add photo'}
            </Text>
          </View>
        )}
        {uploading && (
          <View style={styles.uploadingOverlay}>
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.changeButton} 
        onPress={showImagePicker}
        disabled={uploading}
      >
        <Text style={styles.changeButtonText}>
          {photoUrl ? 'Change Photo' : 'Add Photo'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 15,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: 'white',
    fontSize: 14,
  },
  changeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  changeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});