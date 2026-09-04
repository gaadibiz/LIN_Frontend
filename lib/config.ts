// Configuration for the application
export const config = {
  // Backend API Configuration
  apiUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://lionfish-app-mg3te.ondigitalocean.app',
  backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://lionfish-app-mg3te.ondigitalocean.app',

  // Supabase Configuration (if needed for file uploads)
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },

  // App Configuration
  app: {
    name: 'LoanInNeed',
    version: '1.0.0',
  },
};
