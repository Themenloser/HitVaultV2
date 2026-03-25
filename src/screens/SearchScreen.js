import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { primaryColor, successColor, warningColor, favoriteColor, borderRadius, endpoints } from '../constants/colors';
import StorageService from '../services/StorageService';
import TrackPlayer from 'react-native-track-player';
import RNFS from 'react-native-fs';

const SearchScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({});

  const search = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    Keyboard.dismiss();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(endpoints.search(searchQuery), {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Suche fehlgeschlagen');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      if (error.name === 'AbortError') {
        Alert.alert('Fehler', 'Zeitüberschreitung bei der Suche');
      } else {
        Alert.alert('Fehler', 'Konnte nicht suchen');
      }
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (result) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(endpoints.audio, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: result.url }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Audio konnte nicht geladen werden');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: result.id,
        url: audioUrl,
        title: result.title,
        artist: result.artist,
        artwork: result.thumbnail,
      });
      await TrackPlayer.play();
    } catch (error) {
      if (error.name === 'AbortError') {
        Alert.alert('Fehler', 'Zeitüberschreitung beim Laden');
      } else {
        Alert.alert('Fehler', 'Konnte Audio nicht abspielen');
      }
    }
  };

  const downloadAudio = async (result) => {
    try {
      setDownloadProgress(prev => ({ ...prev, [result.id]: 0 }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(endpoints.audio, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: result.url }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Download fehlgeschlagen');
      }

      const audioData = await response.arrayBuffer();
      const fileName = `${result.id}.mp3`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      await RNFS.writeFile(filePath, Buffer.from(audioData), 'base64');

      const song = {
        id: result.id,
        title: result.title,
        artist: result.artist,
        duration: result.duration,
        thumbnail: result.thumbnail,
        url: result.url,
        localPath: filePath,
        addedAt: new Date().toISOString(),
        starred: false,
      };

      await StorageService.saveSong(song);
      setDownloadProgress(prev => ({ ...prev, [result.id]: 100 }));

      setTimeout(() => {
        setDownloadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[result.id];
          return newProgress;
        });
      }, 1000);
    } catch (error) {
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[result.id];
        return newProgress;
      });

      if (error.name === 'AbortError') {
        Alert.alert('Fehler', 'Zeitüberschreitung beim Download');
      } else {
        Alert.alert('Fehler', 'Konnte Audio nicht herunterladen');
      }
    }
  };

  const downloadVideo = async (result) => {
    try {
      setDownloadProgress(prev => ({ ...prev, [`${result.id}_video`]: 0 }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(endpoints.video, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: result.url }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Video-Download fehlgeschlagen');
      }

      const videoData = await response.arrayBuffer();
      const fileName = `${result.id}.mp4`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      await RNFS.writeFile(filePath, Buffer.from(videoData), 'base64');

      const video = {
        id: result.id,
        title: result.title,
        artist: result.artist,
        duration: result.duration,
        thumbnail: result.thumbnail,
        url: result.url,
        localPath: filePath,
        addedAt: new Date().toISOString(),
      };

      await StorageService.saveVideo(video);
      setDownloadProgress(prev => ({ ...prev, [`${result.id}_video`]: 100 }));

      setTimeout(() => {
        setDownloadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[`${result.id}_video`];
          return newProgress;
        });
      }, 1000);
    } catch (error) {
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[`${result.id}_video`];
        return newProgress;
      });

      if (error.name === 'AbortError') {
        Alert.alert('Fehler', 'Zeitüberschreitung beim Video-Download');
      } else {
        Alert.alert('Fehler', 'Konnte Video nicht herunterladen');
      }
    }
  };

  const toggleFavorite = async (result) => {
    try {
      const song = {
        id: result.id,
        title: result.title,
        artist: result.artist,
        duration: result.duration,
        thumbnail: result.thumbnail,
        url: result.url,
        addedAt: new Date().toISOString(),
        starred: true,
      };

      await StorageService.saveSong(song);
    } catch (error) {
      Alert.alert('Fehler', 'Konnte nicht als Favorit speichern');
    }
  };

  const renderResult = ({ item }) => {
    const audioProgress = downloadProgress[item.id];
    const videoProgress = downloadProgress[`${item.id}_video`];

    return (
      <View
        style={[
          styles.resultCard,
          { backgroundColor: isDarkMode ? '#2c2c2e' : '#ffffff' },
        ]}
      >
        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        <View style={styles.resultInfo}>
          <Text
            style={[styles.resultTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text
            style={[styles.resultArtist, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]}
            numberOfLines={1}
          >
            {item.artist} • {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(item)}
        >
          <Icon
            name="star-border"
            size={20}
            color={favoriteColor}
          />
        </TouchableOpacity>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: primaryColor }]}
            onPress={() => playAudio(item)}
            disabled={!!audioProgress}
          >
            {audioProgress ? (
              <Text style={styles.progressText}>{audioProgress}%</Text>
            ) : (
              <Icon name="headphones" size={16} color="#ffffff" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: successColor }]}
            onPress={() => downloadAudio(item)}
            disabled={!!audioProgress}
          >
            {audioProgress ? (
              <Text style={styles.progressText}>{audioProgress}%</Text>
            ) : (
              <Icon name="download" size={16} color="#ffffff" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: warningColor }]}
            onPress={() => downloadVideo(item)}
            disabled={!!videoProgress}
          >
            {videoProgress ? (
              <Text style={styles.progressText}>{videoProgress}%</Text>
            ) : (
              <Icon name="videocam" size={16} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
          Suchen
        </Text>
      </View>

      <View style={styles.searchSection}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
              color: isDarkMode ? '#ffffff' : '#000000',
            },
          ]}
          placeholder="Suche nach Songs..."
          placeholderTextColor={isDarkMode ? '#8e8e93' : '#8e8e93'}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={search}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={search}>
          <Icon name="search" size={24} color={primaryColor} />
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color={primaryColor} style={styles.loader} />}

      <FlatList
        data={results}
        renderItem={renderResult}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
      />
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
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'System',
    marginRight: 10,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginVertical: 20,
  },
  resultsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  resultCard: {
    borderRadius: borderRadius,
    padding: 12,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 4,
  },
  resultArtist: {
    fontSize: 14,
    fontFamily: 'System',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

export default SearchScreen;