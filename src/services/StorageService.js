import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';

const STORAGE_KEYS = {
  SONGS: 'songs',
  VIDEOS: 'videos',
  PLAYLISTS: 'playlists',
};

class StorageService {
  // Songs
  static async loadSongs() {
    try {
      const songs = await AsyncStorage.getItem(STORAGE_KEYS.SONGS);
      return songs ? JSON.parse(songs) : [];
    } catch (error) {
      console.error('Error loading songs:', error);
      return [];
    }
  }

  static async saveSongs(songs) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SONGS, JSON.stringify(songs));
      return songs;
    } catch (error) {
      console.error('Error saving songs:', error);
      throw error;
    }
  }

  static async saveSong(song) {
    try {
      const songs = await this.loadSongs();
      const existingSongIndex = songs.findIndex(s => s.id === song.id);
      
      if (existingSongIndex >= 0) {
        // Update existing song
        songs[existingSongIndex] = song;
      } else {
        // Add new song
        songs.push(song);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.SONGS, JSON.stringify(songs));
      
      // Update favorites playlist if song is starred
      if (song.starred) {
        await this.updateFavoritesPlaylist(song.id, 'add');
      } else {
        await this.updateFavoritesPlaylist(song.id, 'remove');
      }
      
      return songs;
    } catch (error) {
      console.error('Error saving song:', error);
      throw error;
    }
  }

  static async deleteSong(songId) {
    try {
      const songs = await this.loadSongs();
      const songToDelete = songs.find(s => s.id === songId);
      
      if (songToDelete) {
        // Delete local file if it exists
        if (songToDelete.localPath) {
          try {
            await RNFS.unlink(songToDelete.localPath);
          } catch (fileError) {
            console.warn('Could not delete local file:', fileError);
          }
        }
        
        // Remove from songs array
        const updatedSongs = songs.filter(s => s.id !== songId);
        await AsyncStorage.setItem(STORAGE_KEYS.SONGS, JSON.stringify(updatedSongs));
        
        // Remove from favorites playlist
        await this.updateFavoritesPlaylist(songId, 'remove');
        
        return updatedSongs;
      }
      
      return songs;
    } catch (error) {
      console.error('Error deleting song:', error);
      throw error;
    }
  }

  static async toggleFavorite(songId) {
    try {
      const songs = await this.loadSongs();
      const songIndex = songs.findIndex(s => s.id === songId);
      
      if (songIndex >= 0) {
        songs[songIndex].starred = !songs[songIndex].starred;
        await AsyncStorage.setItem(STORAGE_KEYS.SONGS, JSON.stringify(songs));
        
        // Update favorites playlist
        if (songs[songIndex].starred) {
          await this.updateFavoritesPlaylist(songId, 'add');
        } else {
          await this.updateFavoritesPlaylist(songId, 'remove');
        }
        
        return songs[songIndex];
      }
      
      throw new Error('Song not found');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  // Videos
  static async loadVideos() {
    try {
      const videos = await AsyncStorage.getItem(STORAGE_KEYS.VIDEOS);
      return videos ? JSON.parse(videos) : [];
    } catch (error) {
      console.error('Error loading videos:', error);
      return [];
    }
  }

  static async saveVideo(video) {
    try {
      const videos = await this.loadVideos();
      const existingVideoIndex = videos.findIndex(v => v.id === video.id);
      
      if (existingVideoIndex >= 0) {
        // Update existing video
        videos[existingVideoIndex] = video;
      } else {
        // Add new video
        videos.push(video);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos));
      return videos;
    } catch (error) {
      console.error('Error saving video:', error);
      throw error;
    }
  }

  static async deleteVideo(videoId) {
    try {
      const videos = await this.loadVideos();
      const videoToDelete = videos.find(v => v.id === videoId);
      
      if (videoToDelete) {
        // Delete local file if it exists
        if (videoToDelete.localPath) {
          try {
            await RNFS.unlink(videoToDelete.localPath);
          } catch (fileError) {
            console.warn('Could not delete local file:', fileError);
          }
        }
        
        // Remove from videos array
        const updatedVideos = videos.filter(v => v.id !== videoId);
        await AsyncStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(updatedVideos));
        return updatedVideos;
      }
      
      return videos;
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }

  // Playlists
  static async loadPlaylists() {
    try {
      const playlists = await AsyncStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      return playlists ? JSON.parse(playlists) : [];
    } catch (error) {
      console.error('Error loading playlists:', error);
      return [];
    }
  }

  static async savePlaylists(playlists) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
      return playlists;
    } catch (error) {
      console.error('Error saving playlists:', error);
      throw error;
    }
  }

  static async updateFavoritesPlaylist(songId, action) {
    try {
      const playlists = await this.loadPlaylists();
      const favoritesPlaylist = playlists.find(p => p.id === 'favorites');
      
      if (favoritesPlaylist) {
        if (action === 'add' && !favoritesPlaylist.songs.includes(songId)) {
          favoritesPlaylist.songs.push(songId);
        } else if (action === 'remove') {
          favoritesPlaylist.songs = favoritesPlaylist.songs.filter(id => id !== songId);
        }
        
        await this.savePlaylists(playlists);
      }
    } catch (error) {
      console.error('Error updating favorites playlist:', error);
      throw error;
    }
  }

  // Clear all data
  static async clearAllData() {
    try {
      // Delete all local files
      const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
      for (const file of files) {
        if (file.isFile()) {
          try {
            await RNFS.unlink(file.path);
          } catch (fileError) {
            console.warn('Could not delete file:', file.path);
          }
        }
      }
      
      // Clear AsyncStorage
      await AsyncStorage.multiRemove([STORAGE_KEYS.SONGS, STORAGE_KEYS.VIDEOS, STORAGE_KEYS.PLAYLISTS]);
      
      // Recreate favorites playlist
      const favoritesPlaylist = {
        id: 'favorites',
        name: 'Favoriten',
        icon: 'favorite',
        songs: [],
        isDefault: true,
      };
      
      await this.savePlaylists([favoritesPlaylist]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  // Get storage info
  static async getStorageInfo() {
    try {
      const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      
      const songs = await this.loadSongs();
      const videos = await this.loadVideos();
      const playlists = await this.loadPlaylists();
      
      return {
        totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024)),
        songCount: songs.length,
        videoCount: videos.length,
        playlistCount: playlists.length,
        fileCount: files.length,
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        totalSize: 0,
        totalSizeMB: 0,
        songCount: 0,
        videoCount: 0,
        playlistCount: 0,
        fileCount: 0,
      };
    }
  }
}

export default StorageService;