import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { borderRadius } from '../constants/colors';
import StorageService from '../services/StorageService';
import VideoPlayerModal from '../components/VideoPlayerModal';

const VideosScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const storedVideos = await StorageService.loadVideos();
      setVideos(storedVideos);
      setLoading(false);
    } catch (error) {
      Alert.alert('Fehler', 'Konnte Videos nicht laden');
      setLoading(false);
    }
  };

  const deleteVideo = (video) => {
    Alert.alert(
      'Video löschen',
      `Möchtest du "${video.title}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteVideo(video.id);
              loadVideos();
            } catch (error) {
              Alert.alert('Fehler', 'Konnte Video nicht löschen');
            }
          },
        },
      ]
    );
  };

  const playVideo = (video) => {
    setSelectedVideo(video);
    setShowPlayer(true);
  };

  const renderVideo = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.videoCard,
        {
          backgroundColor: isDarkMode ? '#2c2c2e' : '#ffffff',
          shadowColor: isDarkMode ? '#000' : '#000',
        },
      ]}
      onPress={() => playVideo(item)}
      onLongPress={() => deleteVideo(item)}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      <View style={styles.videoInfo}>
        <Text
          style={[styles.videoTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text
          style={[styles.videoDuration, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]}
        >
          {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#000000' : '#f2f2f7' },
        { paddingTop: insets.top },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Videos
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={videos}
          renderItem={renderVideo}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.videoList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {showPlayer && selectedVideo && (
        <VideoPlayerModal
          video={selectedVideo}
          visible={showPlayer}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  videoList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  videoCard: {
    flexDirection: 'row',
    borderRadius: borderRadius,
    padding: 12,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  videoInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 4,
  },
  videoDuration: {
    fontSize: 14,
    fontFamily: 'System',
  },
});

export default VideosScreen;