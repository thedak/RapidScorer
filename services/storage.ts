import { Session, UserProfile } from '../types';

const STORAGE_KEY = 'bullseye_sessions';
const PROFILE_KEY = 'bullseye_profile';

export const getSessions = (): Session[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load sessions", e);
    return [];
  }
};

export const saveSession = (session: Session) => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session);
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error("Failed to save session", e);
  }
};

export const updateSession = (id: string, updates: Partial<Session>) => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === id);
  
  if (index >= 0) {
    sessions[index] = { ...sessions[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    return sessions[index];
  }
  return null;
};

export const deleteSession = (id: string) => {
  const sessions = getSessions();
  const filtered = sessions.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const calculateSessionScore = (session: Session): number => {
  return session.ends.reduce((total, end) => {
    const endScore = end.arrows.reduce((sum, arrow) => sum + arrow.value, 0);
    return total + endScore;
  }, 0);
};

// --- Profile ---

export const getUserProfile = (): UserProfile => {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error("Failed to load profile", e);
  }
  
  return {
    name: 'Guest Archer',
    equipment: {
      bowName: '',
      riser: '',
      limbs: '',
      poundage: '',
      sightMarks: [],
      arrows: []
    }
  };
};

export const saveUserProfile = (profile: UserProfile) => {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("Failed to save profile", e);
  }
};