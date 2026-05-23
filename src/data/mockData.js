export const matchData = {
  competition: 'GROUP A — MATCHDAY 2',
  venue: 'Estádio Maracanã, Rio de Janeiro',
  date: '2026-06-18',
  minute: 67,
  status: 'LIVE',
  half: '2nd Half',
  htScore: '1 — 1',
  home: { code: 'BRA', name: 'Brazil', flag: '🇧🇷', color: '#1A7A3C', score: 2, formation: '4-3-3' },
  away: { code: 'ARG', name: 'Argentina', flag: '🇦🇷', color: '#6CACE4', score: 1, formation: '4-2-3-1' },
};

export const brazilSquad = [
  { num: 1, name: 'Alisson', pos: 'GK', rating: 89, nat: '🇧🇷', matches: 72, goals: 0, assists: 1 },
  { num: 2, name: 'Danilo', pos: 'RB', rating: 84, nat: '🇧🇷', matches: 58, goals: 1, assists: 6 },
  { num: 3, name: 'Militão', pos: 'CB', rating: 85, nat: '🇧🇷', matches: 33, goals: 2, assists: 0 },
  { num: 4, name: 'Marquinhos', pos: 'CB', rating: 87, nat: '🇧🇷', matches: 86, goals: 6, assists: 1 },
  { num: 6, name: 'Magalhães', pos: 'LB', rating: 83, nat: '🇧🇷', matches: 14, goals: 1, assists: 2 },
  { num: 5, name: 'Casemiro', pos: 'CM', rating: 86, nat: '🇧🇷', matches: 78, goals: 7, assists: 5 },
  { num: 8, name: 'Paquetá', pos: 'CM', rating: 83, nat: '🇧🇷', matches: 49, goals: 10, assists: 8 },
  { num: 10, name: 'Rodrygo', pos: 'CM', rating: 85, nat: '🇧🇷', matches: 28, goals: 6, assists: 5 },
  { num: 11, name: 'Raphinha', pos: 'RW', rating: 84, nat: '🇧🇷', matches: 30, goals: 9, assists: 6 },
  { num: 9, name: 'Endrick', pos: 'ST', rating: 80, nat: '🇧🇷', matches: 12, goals: 4, assists: 1 },
  { num: 7, name: 'Vinicius', pos: 'LW', rating: 89, nat: '🇧🇷', matches: 33, goals: 5, assists: 7 },
];

export const argentinaSquad = [
  { num: 23, name: 'Martínez', pos: 'GK', rating: 88, nat: '🇦🇷', matches: 47, goals: 0, assists: 0 },
  { num: 4, name: 'Montiel', pos: 'RB', rating: 81, nat: '🇦🇷', matches: 30, goals: 2, assists: 3 },
  { num: 13, name: 'Romero', pos: 'CB', rating: 85, nat: '🇦🇷', matches: 39, goals: 3, assists: 1 },
  { num: 25, name: 'Lisandro', pos: 'CB', rating: 84, nat: '🇦🇷', matches: 22, goals: 1, assists: 0 },
  { num: 8, name: 'Acuña', pos: 'LB', rating: 82, nat: '🇦🇷', matches: 45, goals: 2, assists: 5 },
  { num: 7, name: 'De Paul', pos: 'CDM', rating: 85, nat: '🇦🇷', matches: 64, goals: 4, assists: 9 },
  { num: 20, name: 'Mac Allister', pos: 'CDM', rating: 84, nat: '🇦🇷', matches: 30, goals: 3, assists: 4 },
  { num: 24, name: 'Enzo', pos: 'CAM', rating: 84, nat: '🇦🇷', matches: 28, goals: 4, assists: 3 },
  { num: 21, name: 'Dybala', pos: 'RW', rating: 86, nat: '🇦🇷', matches: 40, goals: 3, assists: 4 },
  { num: 22, name: 'Lautaro', pos: 'LW', rating: 87, nat: '🇦🇷', matches: 60, goals: 28, assists: 8 },
  { num: 10, name: 'Messi', pos: 'ST', rating: 93, nat: '🇦🇷', matches: 187, goals: 109, assists: 56 },
];

export const matchStats = [
  { label: 'Possession', home: 58, away: 42, unit: '%' },
  { label: 'Total Shots', home: 14, away: 9 },
  { label: 'Shots on Target', home: 6, away: 4 },
  { label: 'Passes', home: 487, away: 352 },
  { label: 'Pass Accuracy', home: 89, away: 84, unit: '%' },
  { label: 'Fouls', home: 8, away: 12 },
  { label: 'Yellow Cards', home: 1, away: 3 },
  { label: 'Offsides', home: 2, away: 4 },
  { label: 'Corners', home: 7, away: 3 },
];

export const matchEvents = [
  { minute: 12, type: 'goal', team: 'home', player: 'Vinicius Jr.', desc: 'Right-footed shot from inside the box' },
  { minute: 28, type: 'yellow', team: 'away', player: 'De Paul', desc: 'Tactical foul' },
  { minute: 37, type: 'goal', team: 'away', player: 'Messi', desc: 'Free kick, top corner' },
  { minute: 45, type: 'halftime', team: null, player: '', desc: 'Half Time — 1:1' },
  { minute: 58, type: 'goal', team: 'home', player: 'Raphinha', desc: 'Header from corner' },
  { minute: 61, type: 'sub', team: 'away', player: 'Dybala → Álvarez', desc: 'Tactical substitution' },
  { minute: 64, type: 'yellow', team: 'away', player: 'Romero', desc: 'Reckless challenge' },
];

export const chatMessages = [
  { id: '1', user: 'Lucas', flag: '🇧🇷', text: 'VAMOOOOO BRASIL!!! 🇧🇷🇧🇷', time: '12m', mine: false, reactions: { '🔥': 42, '⚽': 18 } },
  { id: '2', user: 'Sofia', flag: '🇦🇷', text: 'Messi siempre Messi 🐐', time: '11m', mine: false, reactions: { '❤️': 67, '👍': 23 } },
  { id: '3', user: 'sys', text: '⚽ GOAL! Vinicius Jr. 12\'', time: '11m', system: true },
  { id: '4', user: 'James', flag: '🇬🇧', text: 'Vini is unstoppable tonight', time: '10m', mine: false, reactions: { '👍': 15 } },
  { id: '5', user: 'You', text: 'What a finish! 🔥', time: '9m', mine: true, reactions: {} },
  { id: '6', user: 'Pedro', flag: '🇵🇹', text: 'Casemiro a muralha no meio campo', time: '8m', mine: false, reactions: { '🔥': 8 } },
  { id: '7', user: 'sys', text: '⚽ GOAL! Messi 37\' — Free kick', time: '5m', system: true },
  { id: '8', user: 'Sofia', flag: '🇦🇷', text: 'EL MEJOR DE LA HISTORIA 🐐🐐🐐', time: '5m', mine: false, reactions: { '🔥': 124, '❤️': 89 } },
  { id: '9', user: 'Marco', flag: '🇮🇹', text: 'What a free kick wow', time: '4m', mine: false, reactions: { '⚽': 22 } },
  { id: '10', user: 'You', text: 'Game is on fire 🔥', time: '3m', mine: true, reactions: { '👍': 4 } },
];

export const aiSummary = [
  'Vinicius Jr. dominating the left flank — most mentioned player',
  'Messi free-kick goal sparked massive engagement from ARG fans',
  'Tactical discussion centered on Casemiro vs De Paul midfield battle',
  'Crowd predicts Brazil to hold the lead through full time',
];

export const galleryItems = Array.from({ length: 12 }).map((_, i) => ({
  id: String(i),
  tags: [['Goal', 'Section B'], ['Crowd', 'Section A'], ['Celebration'], ['Save'], ['Goal', 'Curva'], ['Crowd']][i % 6],
  likes: [124, 89, 56, 234, 432, 78, 12, 198, 67, 345, 23, 156][i],
  archive: i % 4 === 0,
  hue: (i * 47) % 360,
}));

export const complaints = [
  { id: '1', type: 'Physical altercation', icon: 'boxing-glove', priority: 'CRITICAL', section: 'D', row: '14', time: '5m', status: 'In Progress', upvotes: 12 },
  { id: '2', type: 'Harassment', icon: 'account-alert', priority: 'HIGH', section: 'B', row: '32', time: '18m', status: 'Open', upvotes: 8 },
  { id: '3', type: 'Intoxication', icon: 'glass-mug-variant', priority: 'MEDIUM', section: 'C', row: '7', time: '24m', status: 'Open', upvotes: 3 },
  { id: '4', type: 'Lost item', icon: 'bag-personal', priority: 'LOW', section: 'A', row: '21', time: '1h', status: 'Resolved', upvotes: 1 },
  { id: '5', type: 'Medical', icon: 'medical-bag', priority: 'HIGH', section: 'D', row: '18', time: '2m', status: 'In Progress', upvotes: 18 },
];

export const compassSuggestions = [
  'Find hospitals near me',
  'Book a table for 2 tonight',
  'Nearest metro to stadium',
  'Fan zones nearby',
  'Emergency contacts',
  'Currency exchange',
];

export const compassCategories = [
  { icon: '🏥', label: 'Hospitals' },
  { icon: '🏨', label: 'Hotels' },
  { icon: '🍽️', label: 'Restaurants' },
  { icon: '🚌', label: 'Transport' },
  { icon: '🏟️', label: 'Stadium' },
  { icon: '💊', label: 'Pharmacy' },
];
