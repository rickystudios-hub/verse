export const APP_CONFIG = {
  name: 'VÉRSE',
  tagline: 'A rede social livre, privada e com inteligência artificial ética.',
  version: '0.2.0-beta.foundation',
  author: 'VÉRSE Community',
  locale: 'pt-BR',
  limits: {
    maxPostCharacters: 280,
    maxBioCharacters: 160,
    maxDisplayNameCharacters: 60,
    minUsernameCharacters: 3,
    maxUsernameCharacters: 30,
    maxMediaUploadSizeBytes: 4 * 1024 * 1024, // 4 MB
    allowedMediaTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    dailyAiRequestsFreeLimit: 10,
    defaultPageSize: 20,
  },
  routes: {
    home: '/',
    explore: '/explore',
    notifications: '/notifications',
    messages: '/messages',
    profile: (username: string) => `/profile/${username}`,
    settings: '/settings',
    login: '/login',
    register: '/register',
    resetPassword: '/reset-password',
  },
} as const;
