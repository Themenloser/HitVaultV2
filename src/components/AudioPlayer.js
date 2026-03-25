import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import { useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
import TrackPlayer, { useTrackPlayerEvents, Event } from 'react-native-track-player';
import { primaryColor, favoriteColor, cardBorderRadius } from '../constants/colors';
import StorageService from '../services/StorageService';

const { height, width } = Dimensions.get('window');
const coverSize = Math.min(width - 80, 300);

const AudioPlayer = ({ song, visible, onClose }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFavorite, setIsFavorite] = useState(song?.starred || false);
  const panY = useRef(new Animated.Value(0)).current;
  const [showPlayer, setShowPlayer] = useState(visible);

  useEffect(() => {
    setShowPlayer(visible);
    if (visible && song) {
      setupPlayer();
    }
  }, [visible, song]);

  const setupPlayer = async () => {
    try {
      await TrackPlayer.reset();
      
      const track = {
        id: song.id,
        url: song.localPath || song.url,
        title: song.title,
        artist: song.artist,
        artwork: song.thumbnail,
      };
      
      await TrackPlayer.add(track);
      await TrackPlayer.play();
      setIsPlaying(true);
      
      // Check if song is favorite
      const songs = await StorageService.loadSongs();
      const currentSong = songs.find(s => s.id === song.id);
      setIsFavorite(currentSong?.starred || false);
    } catch (error) {
      console.error('Error setting up player:', error);
    }
  };

  useTrackPlayerEvents([Event.PlaybackState, Event.PlaybackTrackChanged], (event) => {
    if (event.type === Event.PlaybackState) {
      setIsPlaying(event.state === 'playing');
    }
  });

  useEffect(() => {
    const updateProgress = async () => {
      try {
        const currentPosition = await TrackPlayer.getPosition();
        const currentDuration = await TrackPlayer.getDuration();
        setPosition(currentPosition);
        setDuration(currentDuration);
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    };

    const interval = setInterval(updateProgress, 1000);
    return () => clearInterval(interval);
  }, []);

  const togglePlayPause = async () => {
    try {
      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const skipBackward = async () => {
    try {
      const currentPosition = await TrackPlayer.getPosition();
      const newPosition = Math.max(0, currentPosition - 15);
      await TrackPlayer.seekTo(newPosition);
    } catch (error) {
      console.error('Error skipping backward:', error);
    }
  };

  const skipForward = async () => {
    try {
      const currentPosition = await TrackPlayer.getPosition();
      const currentDuration = await TrackPlayer.getDuration();
      const newPosition = Math.min(currentDuration, currentPosition + 15);
      await TrackPlayer.seekTo(newPosition);
    } catch (error) {
      console.error('Error skipping forward:', error);
    }
  };

  const changeSpeed = async (speed) => {
    try {
      await TrackPlayer.setRate(speed);
      setPlaybackSpeed(speed);
    } catch (error) {
      console.error('Error changing speed:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      await StorageService.toggleFavorite(song.id);
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const onSliderValueChange = async (value) => {
    try {
      await TrackPlayer.seekTo(value);
      setPosition(value);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        panY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 80) {
          onClose();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleClose = () => {
    Animated.spring(panY, {
      toValue: height,
      useNativeDriver: true,
    }).start(() => {
      setShowPlayer(false);
      onClose();
    });
  };

  if (!showPlayer || !song) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View
        style={[
          styles.blurOverlay,
          { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)' }
        ]}
      />
      
      <Animated.View
        style={[
          styles.playerContainer,
          {
            backgroundColor: isDarkMode ? 'rgba(44, 44, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            transform: [{ translateY: panY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Close Handle */}
        <View style={styles.closeHandle}>
          <View style={[styles.handle, { backgroundColor: isDarkMode ? '#8e8e93' : '#8e8e93' }]} />
        </View>

        {/* Favorite Button */}
        <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
          <Icon
            name={isFavorite ? 'favorite' : 'favorite-border'}
            size={32}
            color={isFavorite ? favoriteColor : (isDarkMode ? '#ffffff' : '#000000')}
          />
        </TouchableOpacity>

        {/* Cover Image */}
        <View style={styles.coverContainer}>
          <Image source={{ uri: song.thumbnail }} style={styles.coverImage} />
        </View>

        {/* Song Info */}
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

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration || 1}
            value={position}
            onValueChange={onSliderValueChange}
            minimumTrackTintColor={primaryColor}
            maximumTrackTintColor={isDarkMode ? '#4a4a4c' : '#e5e5ea'}
            thumbStyle={{ width: 20, height: 20, backgroundColor: primaryColor }}
          />
          <View style={styles.timeContainer}>
            <Text style={[styles.timeText, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]}>
              {formatTime(position)}
            </Text>
            <Text style={[styles.timeText, { color: isDarkMode ? '#8e8e93' : '#8e8e93' }]}>
              {formatTime(duration)}
            </Text>
          </View>
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton} onPress={skipBackward}>
            <Icon
              name="replay-15"
              size={32}
              color={isDarkMode ? '#ffffff' : '#000000'}
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.playPauseButton} onPress={togglePlayPause}>
            <Icon
              name={isPlaying ? 'pause-circle-filled' : 'play-circle-filled'}
              size={64}
              color={primaryColor}
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={skipForward}>
            <Icon
              name="forward-15"
              size={32}
              color={isDarkMode ? '#ffffff' : '#000000'}
            />
          </TouchableOpacity>
        </View>

        {/* Speed Controls */}
        <View style={styles.speedContainer}>
          <TouchableOpacity
            style={[
              styles.speedButton,
              { backgroundColor: playbackSpeed === 0.5 ? primaryColor : (isDarkMode ? '#2c2c2e' : '#f2f2f7') },
            ]}
            onPress={() => changeSpeed(0.5)}
          >
            <Text
              style={[
                styles.speedText,
                { color: playbackSpeed === 0.5 ? '#ffffff' : (isDarkMode ? '#ffffff' : '#000000') },
              ]}
            >
              0.5x
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.speedButton,
              { backgroundColor: playbackSpeed === 1 ? primaryColor : (isDarkMode ? '#2c2c2e' : '#f2f2f7') },
            ]}
            onPress={() => changeSpeed(1)}
          >
            <Text
              style={[
                styles.speedText,
                { color: playbackSpeed === 1 ? '#ffffff' : (isDarkMode ? '#ffffff' : '#000000') },
              ]}
            >
              1x
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.speedButton,
              { backgroundColor: playbackSpeed === 1.5 ? primaryColor : (isDarkMode ? '#2c2c2e' : '#f2f2f7') },
            ]}
            onPress={() => changeSpeed(1.5)}
          >
            <Text
              style={[
                styles.speedText,
                { color: playbackSpeed === 1.5 ? '#ffffff' : (isDarkMode ? '#ffffff' : '#000000') },
              ]}
            >
              1.5x
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.speedButton,
              { backgroundColor: playbackSpeed === 2 ? primaryColor : (isDarkMode ? '#2c2c2e' : '#f2f2f7') },
            ]}
            onPress={() => changeSpeed(2)}
          >
            <Text
              style={[
                styles.speedText,
                { color: playbackSpeed === 2 ? '#ffffff' : (isDarkMode ? '#ffffff' : '#000000') },
              ]}
            >
              2x
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  playerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.85,
    borderTopLeftRadius: cardBorderRadius,
    borderTopRightRadius: cardBorderRadius,
    padding: 20,
  },
  closeHandle: {
    alignItems: 'center',
    marginBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  favoriteButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  coverContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  coverImage: {
    width: coverSize,
    height: coverSize,
    borderRadius: cardBorderRadius,
  },
  songInfo: {
    alignItems: 'center',
    marginVertical: 20,
  },
  songTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'System',
    textAlign: 'center',
    marginBottom: 8,
  },
  songArtist: {
    fontSize: 16,
    fontFamily: 'System',
    textAlign: 'center',
  },
  progressContainer: {
    marginVertical: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'System',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  controlButton: {
    padding: 10,
  },
  playPauseButton: {
    marginHorizontal: 20,
  },
  speedContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  speedButton: {
    width: 60,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

export default AudioPlayer;