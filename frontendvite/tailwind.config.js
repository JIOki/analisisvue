/** @type {import('tailwindcss').Config} */
import PrimeUI from 'tailwindcss-primeui';

export default {
    darkMode: ['selector', '[class*="app-dark"]'],
    content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
    plugins: [PrimeUI],
    theme: {
        screens: {
            sm: '576px',
            md: '768px',
            lg: '992px',
            xl: '1200px',
            '2xl': '1920px'
        },
        extend: {
            fontFamily: {
                'primary': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
                'monospace': ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
            },
            colors: {
                // Colores primarios (Acento Azul)
                primary: {
                    50: '#EFF6FF',
                    100: '#DBEAFE',
                    500: '#3B82F6',
                    600: '#2563EB',
                    700: '#1D4ED8',
                    900: '#1E3A8A'
                },
                // Color secundario (Violeta)
                'primary-alt': {
                    500: '#8B5CF6'
                },
                // Colores neutrales
                neutral: {
                    50: '#F9FAFB',
                    100: '#F3F4F6',
                    200: '#E5E7EB',
                    400: '#9CA3AF',
                    600: '#4B5563',
                    900: '#111827'
                },
                // Colores semánticos
                semantic: {
                    success: '#10B981',
                    error: '#EF4444',
                    warning: '#F59E0B',
                    info: '#3B82F6'
                }
            },
            backgroundImage: {
                'gradient-light': 'linear-gradient(135deg, #E8EAF0 0%, #F4F5F9 50%, #FAFBFF 100%)',
                'gradient-dark': 'linear-gradient(135deg, #0F1419 0%, #1A1F2E 50%, #252B3B 100%)'
            },
            boxShadow: {
                'glass-sm': '0 2px 8px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02)',
                'glass-card': '0 8px 32px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.3)',
                'glass-card-hover': '0 12px 40px rgba(0,0,0,0.12), 0 6px 20px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.4)',
                'glass-modal': '0 24px 64px rgba(0,0,0,0.16), 0 12px 32px rgba(0,0,0,0.08), inset 0 2px 0 rgba(255,255,255,0.4)'
            },
            backdropBlur: {
                'glass-light': 'blur(20px) saturate(150%)',
                'glass-medium': 'blur(25px) saturate(160%)',
                'glass-heavy': 'blur(40px) saturate(150%)',
                'glass-navbar': 'blur(15px) saturate(180%)'
            },
            spacing: {
                '18': '4.5rem',
                '22': '5.5rem',
                '128': '32rem',
                '144': '36rem'
            },
            borderRadius: {
                'glass': '20px',
                'glass-xl': '24px',
                'glass-2xl': '28px'
            },
            animation: {
                'glass-fade': 'fadeIn 0.4s ease-out',
                'glass-slide': 'slideUp 0.3s ease-out',
                'glass-lift': 'liftHover 0.3s ease-out'
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' }
                },
                liftHover: {
                    '0%': { transform: 'translateY(0)' },
                    '100%': { transform: 'translateY(-4px)' }
                }
            }
        }
    }
};