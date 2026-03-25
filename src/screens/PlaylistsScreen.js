import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { primaryColor, errorColor, borderRadius } from '../constants/colors';
import StorageService from '../services/StorageService';

const PlaylistsScreen = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [songs, setSongs] = useState([]);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState([]);

  useEffect(() => {
    loadPlaylists();
    loadSongs();
  }, []);

  const loadPlaylists = async () => {
    try {
      let storedPlaylists = await StorageService.loadPlaylists();
      
      // Ensure "Favoriten" playlist exists
      const favoritesPlaylist = storedPlaylists.find(p => p.id === 'favorites');
      if (!favoritesPlaylist) {
        const favorites = {
          id: 'favorites',
          name: 'Favoriten',
          icon: 'favorite',
          songs: [],
          isDefault: true,
        };
        storedPlaylists = [favorites, ...storedPlaylists];
        await StorageService.savePlaylists(storedPlaylists);
      }
      
      setPlaylists(storedPlaylists);
      setLoading(false);
    } catch (error) {
      Alert.alert('Fehler', 'Konnte Playlists nicht laden');
      setLoading(false);
    }
  };

  const loadSongs = async () => {
    try {
      const storedSongs = await StorageService.loadSongs();
      setSongs(storedSongs);
    } catch (error) {
      console.error('Error loading songs:', error);
    }
  };

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Fehler', 'Bitte gib einen Namen ein');
      return;
    }

    try {
      const newPlaylist = {
        id: Date.now().toString(),
        name: newPlaylistName.trim(),
        icon: 'playlist-music',
        songs: [],
        isDefault: false,
      };

      const updatedPlaylists = [...playlists, newPlaylist];
      await StorageService.savePlaylists(updatedPlaylists);
      setPlaylists(updatedPlaylists);
      setNewPlaylistName('');
      setShowCreateModal(false);
    } catch (error) {
      Alert.alert('Fehler', 'Konnte Playlist nicht erstellen');
    }
  };

  const deletePlaylist = (playlistId) => {
    Alert.alert(
      'Playlist löschen',
      'Möchtest du diese Playlist wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedPlaylists = playlists.filter(p => p.id !== playlistId);
              await StorageService.savePlaylists(updatedPlaylists);
              setPlaylists(updatedPlaylists);
            } catch (error) {
              Alert.alert('Fehler', 'Konnte Playlist nicht löschen');
            }
          },
        },
      ]
    );
  };

  const renamePlaylist = (playlist) => {
    Alert.prompt(
      'Playlist umbenennen',
      'Gib einen neuen Namen ein:',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Umbenennen',
          onPress: async (newName) => {
            if (!newName || !newName.trim()) return;
            
            try {
              const updatedPlaylists = playlists.map(p =>
                p.id === playlist.id ? { ...p, name: newName.trim() } : p
              );
              await StorageService.savePlaylists(updatedPlaylists);
              setPlaylists(updatedPlaylists);
            } catch (error) {
              Alert.alert('Fehler', 'Konnte Playlist nicht umbenennen');
            }
          },
        },
      ],
      'plain-text',
      playlist.name
    );
  };

  const openPlaylist = (playlist) => {
    setSelectedPlaylist(playlist);
    setShowPlaylistModal(true);
  };

  const removeSongFromPlaylist = async (songId) => {
    try {
      const updatedSongs = selectedPlaylist.songs.filter(id => id !== songId);
      const updatedPlaylist = { ...selectedPlaylist, songs: updatedSongs };
      
      const updatedPlaylists = playlists.map(p =>
        p.id === selectedPlaylist.id ? updatedPlaylist : p
      );
      
      await StorageService.savePlaylists(updatedPlaylists);
      setPlaylists(updatedPlaylists);
      setSelectedPlaylist(updatedPlaylist);
    } catch (error) {
      Alert.alert('Fehler', 'Konnte Song nicht entfernen');
    }
  };

  const addSongsToPlaylist = async () => {
    if (selectedSongs.length === 0) {
      Alert.alert('Fehler', 'Bitte wähle Songs aus');
      return;
    }

    try {
      const updatedSongs = [...new Set([...selectedPlaylist.songs, ...selectedSongs])];
      const updatedPlaylist = { ...selectedPlaylist, songs: updatedSongs };
      
      const updatedPlaylists = playlists.map(p =>
        p.id === selectedPlaylist.id ? updatedPlaylist : p
      );
      
      await StorageService.savePlaylists(updatedPlaylists);
      setPlaylists(updatedPlaylists);
      setSelectedPlaylist(updatedPlaylist);
      setSelectedSongs([]);
      setShowAddToPlaylistModal(false);
    } catch (error) {
      Alert.alert('Fehler', 'Konnte Songs nicht hinzufügen');
    }
  };

  const toggleSongSelection = (songId) => {
    setSelectedSongs(prev =>
      prev.includes(songId)
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    );
  };

  const renderPlaylist = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.playlistCard,
        {
          backgroundColor: isDarkMode ? '#2c2c2e' : '#ffffff',
          shadowColor: isDarkMode ? '#000' : '#000',
        },
      ]}
      onPress={() => openPlaylist(item)}
      onLongPress={() => {
        if (!item.isDefault) {
          Alert.alert(
            'Playlist',
            item.name,
            [
              { text: 'Abbrechen', style: 'cancel' },
              { text: 'Umbenennen', onPress: () => renamePlaylist(item) },
              { text: 'Löschen', style: 'destructive', onPress: () => deletePlaylist(item.id) },
            ]
          );
        }
      }}
    >
      <View style={styles.playlistInfo}>
        <Icon
          name={item.icon}
          size={32}
          color={primaryColor}
          style={styles.playlistIcon}
        />
        <View style={styles.playlistText}>
          <Text
            style={[styles.playlistName, { color: isDarkMode ? '#ffffff' : '#000000' }]}
          >
            {item.name}
          </Text>
          <Text
            style={[styles.playlistCount, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]}
          >
            {item.songs.length} Songs
          </Text>
        </View>
      </View>
      <Icon
        name="chevron-right"
        size={24}
        color={isDarkMode ? '#8e8e93' : '#8e8e93'}
      />
    </TouchableOpacity>
  );

  const renderSong = ({ item }) => {
    const isSelected = selectedSongs.includes(item.id);
    const isInPlaylist = selectedPlaylist.songs.includes(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.songItem,
          {
            backgroundColor: isSelected ? primaryColor : (isDarkMode ? '#2c2c2e' : '#ffffff'),
          },
        ]}
        onPress={() => toggleSongSelection(item.id)}
      >
        <Text
          style={[
            styles.songTitle,
            {
              color: isSelected ? '#ffffff' : (isDarkMode ? '#ffffff' : '#000000'),
            },
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        {isInPlaylist && (
          <Icon name="check" size={16} color={isSelected ? '#ffffff' : primaryColor} />
        )}
      </TouchableOpacity>
    );
  };

  const renderPlaylistSong = ({ item }) => {
    const song = songs.find(s => s.id === item);
    if (!song) return null;

    return (
      <View
        style={[
          styles.playlistSongItem,
          { backgroundColor: isDarkMode ? '#2c2c2e' : '#ffffff' },
        ]}
      >
        <Text
          style={[styles.playlistSongTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}
          numberOfLines={1}
        >
          {song.title}
        </Text>
        <TouchableOpacity
          onPress={() => removeSongFromPlaylist(item)}
        >
          <Icon name="remove-circle" size={24} color={errorColor} />
        </TouchableOpacity>
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
          Playlists
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Icon name="add" size={24} color={primaryColor} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={[styles.loadingText, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]}>
          Lade Playlists...
        </Text>
      ) : (
        <FlatList
          data={playlists}
          renderItem={renderPlaylist}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.playlistList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Playlist Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDarkMode ? '#2c2c2e' : '#ffffff' },
            ]}
          >
            <Text
              style={[styles.modalTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}
            >
              Neue Playlist
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDarkMode ? '#1c1c1e' : '#f2f2f7',
                  color: isDarkMode ? '#ffffff' : '#000000',
                },
              ]}
              placeholder="Playlist Name"
              placeholderTextColor={isDarkMode ? '#8e8e93' : '#8e8e93'}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setNewPlaylistName('');
                  setShowCreateModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createButton} onPress={createPlaylist}>
                <Text style={styles.createButtonText}>Erstellen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Playlist Detail Modal */}
      <Modal
        visible={showPlaylistModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPlaylistModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDarkMode ? '#2c2c2e' : '#ffffff' },
            ]}
          >
            <View style={styles.playlistHeader}>
              <Text
                style={[styles.modalTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}
              >
                {selectedPlaylist?.name}
              </Text>
              <TouchableOpacity
                style={styles.addToPlaylistButton}
                onPress={() => setShowAddToPlaylistModal(true)}
              >
                <Icon name="add" size={20} color={primaryColor} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={selectedPlaylist?.songs || []}
              renderItem={renderPlaylistSong}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.songsList}
              showsVerticalScrollIndicator={false}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPlaylistModal(false)}
            >
              <Text style={styles.closeButtonText}>Schließen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add to Playlist Modal */}
      <Modal
        visible={showAddToPlaylistModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddToPlaylistModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDarkMode ? '#2c2c2e' : '#ffffff' },
            ]}
          >
            <Text
              style={[styles.modalTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}
            >
              Songs hinzufügen
            </Text>
            <FlatList
              data={songs}
              renderItem={renderSong}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.songsList}
              showsVerticalScrollIndicator={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setSelectedSongs([]);
                  setShowAddToPlaylistModal(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={addSongsToPlaylist}
              >
                <Text style={styles.createButtonText}>Hinzufügen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    fontFamily: 'System',
  },
  playlistList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  playlistCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: borderRadius,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playlistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playlistIcon: {
    marginRight: 16,
  },
  playlistText: {
    flex: 1,
  },
  playlistName: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 4,
  },
  playlistCount: {
    fontSize: 14,
    fontFamily: 'System',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: borderRadius,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'System',
    marginBottom: 16,
  },
  input: {
    height: 44,
    borderRadius: borderRadius,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'System',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    color: '#007AFF',
  },
  createButton: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius,
    backgroundColor: primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    color: '#ffffff',
  },
  playlistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addToPlaylistButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  songsList: {
    maxHeight: 300,
  },
  songItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: borderRadius,
    padding: 12,
    marginBottom: 8,
  },
  songTitle: {
    fontSize: 16,
    fontFamily: 'System',
    flex: 1,
  },
  playlistSongItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: borderRadius,
    padding: 12,
    marginBottom: 8,
  },
  playlistSongTitle: {
    fontSize: 16,
    fontFamily: 'System',
    flex: 1,
  },
  closeButton: {
    height: 44,
    borderRadius: borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    color: '#007AFF',
  },
});

export default PlaylistsScreen;