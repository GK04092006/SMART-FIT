import { useState, useEffect, useCallback } from 'react';
import API from '../services/api';

export const useWorkout = (initialCategory = 'All', initialDifficulty = 'All') => {
  const [workouts, setWorkouts] = useState([]);
  const [adventures, setAdventures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [difficultyFilter, setDifficultyFilter] = useState(initialDifficulty);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/fitness', {
        params: {
          category: categoryFilter,
          difficulty: difficultyFilter,
          search: searchQuery,
        },
      });
      setWorkouts(data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load workouts');
      setLoading(false);
    }
  }, [categoryFilter, difficultyFilter, searchQuery]);

  const fetchAdventures = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/adventure', {
        params: {
          category: categoryFilter,
          difficulty: difficultyFilter,
          search: searchQuery,
        },
      });
      setAdventures(data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load adventures');
      setLoading(false);
    }
  }, [categoryFilter, difficultyFilter, searchQuery]);

  return {
    workouts,
    adventures,
    loading,
    error,
    categoryFilter,
    setCategoryFilter,
    difficultyFilter,
    setDifficultyFilter,
    searchQuery,
    setSearchQuery,
    fetchWorkouts,
    fetchAdventures,
  };
};
