import React, { useState, useEffect, useCallback } from 'react';
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
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { primaryColor, borderRadius, favoriteColor } from '../constants/colors';
import StorageService from '../services/StorageService';
import AudioPlayer from '../components/AudioPlayer';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

const LibraryScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [loading, setLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    loadSongs();
  }, []);

  useEffect(() => {
    filterAndSortSongs();
  }, [songs, searchQuery, sortBy]);

  const loadSongs = async () => {
    try {
      const storedSongs = await StorageService.loadSongs();
      
      // If no songs exist, add some demo songs
      if (storedSongs.length === 0) {
        const demoSongs = [
          {
            id: '1',
            title: 'Demo Song 1',
            artist: 'Demo Artist 1',
            thumbnail: 'https://via.placeholder.com/300x300/007AFF/FFFFFF?text=Song+1',
            videoId: 'dQw4w9WgXcQ',
            starred: false,
            addedAt: new Date().toISOString()
          },
          {
            id: '2',
            title: 'Demo Song 2',
            artist: 'Demo Artist 2',
            thumbnail: 'https://via.placeholder.com/300x300/34C759/FFFFFF?text=Song+2',
            videoId: 'dQw4w9WgXcQ',
            starred: true,
            addedAt: new Date().toISOString()
          },
          {
            id: '3',
            title: 'Demo Song 3',
            artist: 'Demo Artist 3',
            thumbnail: 'https://via.placeholder.com/300x300/FF9500/FFFFFF?text=Song+3',
            videoId: 'dQw4w9WgXcQ',
            starred: false,
            addedAt: new Date().toISOString()
          }
        ];
        
        await StorageService.saveSongs(demoSongs);
        setSongs(demoSongs);
      } else {
        setSongs(storedSongs);
      }
      
      setLoading(false);
    } catch (error) {
      // Fallback demo songs if storage fails
      const fallbackSongs = [
        {
          id: '1',
          title: 'Demo Song 1',
          artist: 'Demo Artist 1',
          thumbnail: 'https://via.placeholder.com/300x300/007AFF/FFFFFF?text=Song+1',
          videoId: 'dQw4w9WgXcQ',
          starred: false,
          addedAt: new Date().toISOString()
        }
      ];
      setSongs(fallbackSongs);
      setLoading(false);
    }
  };

  const filterAndSortSongs = () => {
    let filtered = songs;

    if (searchQuery) {
      filtered = songs.filter(
        song =>
          song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          song.artist.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'artist':
          return a.artist.localeCompare(b.artist);
        case 'date':
        default:
          return new Date(b.addedAt) - new Date(a.addedAt);
      }
    });

    setFilteredSongs(sorted);
  };

  const toggleFavorite = async (songId) => {
    try {
      await StorageService.toggleFavorite(songId);
      loadSongs();
    } catch (error) {
      Alert.alert('Fehler', 'Konnte Favorit nicht togglen');
    }
  };

  const deleteSong = (song) => {
    Alert.alert(
      'Song löschen',
      `Möchtest du "${song.title}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteSong(song.id);
              loadSongs();
            } catch (error) {
              Alert.alert('Fehler', 'Konnte Song nicht löschen');
            }
          },
        },
      ]
    );
  };

  const playSong = (song) => {
    setSelectedSong(song);
    setShowPlayer(true);
  };

  const renderSong = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.songCard,
        {
          backgroundColor: isDarkMode ? '#2c2c2e' : '#ffffff',
          shadowColor: isDarkMode ? '#000' : '#000',
        },
      ]}
      onPress={() => playSong(item)}
      onLongPress={() => deleteSong(item)}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      <View style={styles.songInfo}>
        <Text
          style={[styles.songTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text
          style={[styles.songArtist, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]}
          numberOfLines={1}
        >
          {item.artist}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={() => toggleFavorite(item.id)}
      >
        <Icon
          name={item.starred ? 'star' : 'star-border'}
          size={24}
          color={item.starred ? favoriteColor : isDarkMode ? '#8e8e93' : '#8e8e93'}
        />
      </TouchableOpacity>
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
          Bibliothek
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
          placeholder="Songs durchsuchen..."
          placeholderTextColor={isDarkMode ? '#8e8e93' : '#8e8e93'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.sortSection}>
        <TouchableOpacity
          style={[
            styles.sortButton,
            { backgroundColor: sortBy === 'date' ? primaryColor : (isDarkMode ? '#2c2c2e' : '#ffffff') },
          ]}
          onPress={() => setSortBy('date')}
        >
          <Text style={[styles.sortButtonText, { color: sortBy === 'date' ? '#ffffff' : (isDarkMode ? '#ffffff' : '#000000') }]}>
            Datum
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            { backgroundColor: sortBy === 'title' ? primaryColor : (isDarkMode ? '#2c2c2e' : '#ffffff') },
          ]}
          onPress={() => setSortBy('title')}
        >
          <Text style={[styles.sortButtonText, { color: sortBy === 'title' ? '#ffffff' : (isDarkMode ? '#ffffff' : '#000000') }]}>
            Titel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            { backgroundColor: sortBy === 'artist' ? primaryColor : (isDarkMode ? '#2c2c2e' : '#ffffff') },
          ]}
          onPress={() => setSortBy('artist')}
        >
          <Text style={[styles.sortButtonText, { color: sortBy === 'artist' ? '#ffffff' : (isDarkMode ? '#ffffff' : '#000000') }]}>
            Artist
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={primaryColor} />
      ) : (
        <FlatList
          data={filteredSongs}
          renderItem={renderSong}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.songList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {showPlayer && selectedSong && (
        <AudioPlayer
          song={selectedSong}
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
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchInput: {
    height: 44,
    borderRadius: borderRadius,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'System',
  },
  sortSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  sortButton: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
  },
  songList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  songCard: {
    width: cardWidth,
    margin: 4,
    borderRadius: borderRadius,
    padding: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    width: '100%',
    height: cardWidth - 24,
    borderRadius: 8,
    marginBottom: 8,
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 12,
    fontFamily: 'System',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});

export default LibraryScreen;