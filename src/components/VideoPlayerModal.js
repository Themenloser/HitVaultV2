import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Video from 'react-native-video';
import { borderRadius } from '../constants/colors';
import RNFS from 'react-native-fs';

const { height, width } = Dimensions.get('window');

const VideoPlayerModal = ({ video, visible, onClose }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef(null);

  const onVideoLoad = () => {
    setIsLoading(false);
  };

  const onVideoProgress = (progress) => {
    setCurrentTime(progress.currentTime);
    setDuration(progress.seekableDuration);
  };

  const onVideoEnd = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const seekTo = (time) => {
    if (videoRef.current) {
      videoRef.current.seek(time);
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVideoSource = () => {
    if (video?.localPath && RNFS.exists(video.localPath)) {
      return { uri: `file://${video.localPath}` };
    }
    return { uri: video?.url };
  };

  if (!visible || !video) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.blurOverlay,
          { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)' }
        ]}
      />
      
      <View style={styles.playerContainer}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="close" size={32} color="#ffffff" />
        </TouchableOpacity>

        {/* Video Player */}
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={getVideoSource()}
            style={styles.video}
            resizeMode="contain"
            controls={false}
            onLoad={onVideoLoad}
            onProgress={onVideoProgress}
            onEnd={onVideoEnd}
            paused={!isPlaying}
            repeat={false}
          />

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
            </View>
          )}

          {/* Video Info */}
          <View style={styles.videoInfo}>
            <Text style={styles.videoTitle} numberOfLines={2}>
              {video.title}
            </Text>
            <Text style={styles.videoArtist}>
              {video.artist}
            </Text>
          </View>

          {/* Play/Pause Overlay */}
          {!isLoading && (
            <TouchableOpacity style={styles.playPauseOverlay} onPress={togglePlayPause}>
              <Icon
                name={isPlaying ? 'pause-circle-filled' : 'play-circle-filled'}
                size={80}
                color="#ffffff"
              />
            </TouchableOpacity>
          )}

          {/* Progress Bar */}
          {!isLoading && (
            <View style={styles.progressContainer}>
              <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(currentTime / duration) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  playerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: width - 40,
    height: (width - 40) * (9 / 16),
    backgroundColor: '#000000',
    borderRadius: borderRadius,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  videoInfo: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 60,
  },
  videoTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'System',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  videoArtist: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'System',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  playPauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'System',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginHorizontal: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
});

export default VideoPlayerModal;