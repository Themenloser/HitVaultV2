import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { borderRadius, favoriteColor } from '../constants/colors';

const SongCard = ({ song, onPress, onLongPress, onToggleFavorite }) => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isDarkMode ? '#2c2c2e' : '#ffffff',
          shadowColor: isDarkMode ? '#000' : '#000',
        },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Image source={{ uri: song.thumbnail }} style={styles.thumbnail} />
      <View style={styles.songInfo}>
        <Text
          style={[styles.songTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}
          numberOfLines={2}
        >
          {song.title}
        </Text>
        <Text
          style={[styles.songArtist, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]}
          numberOfLines={1}
        >
          {song.artist}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={onToggleFavorite}
      >
        <Icon
          name={song.starred ? 'star' : 'star-border'}
          size={24}
          color={song.starred ? favoriteColor : isDarkMode ? '#8e8e93' : '#8e8e93'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
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
  songInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  songTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 14,
    fontFamily: 'System',
  },
  favoriteButton: {
    padding: 8,
  },
});

export default SongCard;