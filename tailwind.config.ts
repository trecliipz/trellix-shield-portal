import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				trellix: {
					orange: {
						DEFAULT: 'hsl(var(--trellix-orange))',
						light: 'hsl(var(--trellix-orange-light))',
						dark: 'hsl(var(--trellix-orange-dark))',
						hover: 'hsl(var(--trellix-orange-hover))'
					},
					red: {
						DEFAULT: 'hsl(var(--trellix-red))',
						light: 'hsl(var(--trellix-red-light))',
						dark: 'hsl(var(--trellix-red-dark))'
					},
					blue: {
						DEFAULT: 'hsl(var(--trellix-blue))',
						light: 'hsl(var(--trellix-blue-light))'
					},
					dark: 'hsl(var(--trellix-dark))',
					darker: 'hsl(var(--trellix-darker))',
					gray: {
						DEFAULT: 'hsl(var(--trellix-gray))',
						light: 'hsl(var(--trellix-gray-light))'
					}
				},
				cyber: {
					green: 'hsl(var(--cyber-green))',
					yellow: 'hsl(var(--cyber-yellow))'
				}
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-hero': 'var(--gradient-hero)',
				'gradient-card': 'var(--gradient-card)',
				'gradient-button': 'var(--gradient-button)',
				'gradient-button-secondary': 'var(--gradient-button-secondary)',
				'gradient-cyber': 'var(--gradient-cyber)',
				'gradient-warning': 'var(--gradient-warning)',
				'gradient-success': 'var(--gradient-success)'
			},
			boxShadow: {
				'glow': 'var(--shadow-glow)',
				'glow-red': 'var(--shadow-glow-red)',
				'cyber': 'var(--shadow-cyber)',
				'card': 'var(--shadow-card)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'flow-right': {
					'0%': { transform: 'translateX(-100%) scale(0)', opacity: '0', filter: 'blur(2px)' },
					'10%': { opacity: '0.8', transform: 'translateX(-80%) scale(0.6)', filter: 'blur(1px)' },
					'50%': { opacity: '1', transform: 'translateX(0%) scale(1)', filter: 'blur(0px)' },
					'90%': { opacity: '0.8', transform: 'translateX(80%) scale(0.6)', filter: 'blur(1px)' },
					'100%': { transform: 'translateX(100%) scale(0)', opacity: '0', filter: 'blur(2px)' }
				},
				'flow-left': {
					'0%': { transform: 'translateX(100%) scale(0)', opacity: '0', filter: 'blur(2px)' },
					'10%': { opacity: '0.8', transform: 'translateX(80%) scale(0.6)', filter: 'blur(1px)' },
					'50%': { opacity: '1', transform: 'translateX(0%) scale(1)', filter: 'blur(0px)' },
					'90%': { opacity: '0.8', transform: 'translateX(-80%) scale(0.6)', filter: 'blur(1px)' },
					'100%': { transform: 'translateX(-100%) scale(0)', opacity: '0', filter: 'blur(2px)' }
				},
				'pulse-glow': {
					'0%, 100%': { 
						boxShadow: '0 0 10px hsl(var(--primary) / 0.3), 0 0 20px hsl(var(--primary) / 0.1), inset 0 0 5px hsl(var(--primary) / 0.1)', 
						transform: 'scale(1)',
						borderColor: 'hsl(var(--primary) / 0.5)'
					},
					'50%': { 
						boxShadow: '0 0 25px hsl(var(--primary) / 0.6), 0 0 50px hsl(var(--primary) / 0.3), inset 0 0 10px hsl(var(--primary) / 0.2)', 
						transform: 'scale(1.02)',
						borderColor: 'hsl(var(--primary) / 0.8)'
					}
				},
				'data-packet': {
					'0%': { transform: 'translateX(-10px) scale(0)', opacity: '0', boxShadow: '0 0 0px hsl(var(--primary))' },
					'20%': { opacity: '1', transform: 'translateX(0px) scale(1)', boxShadow: '0 0 8px hsl(var(--primary))' },
					'80%': { opacity: '1', transform: 'translateX(0px) scale(1)', boxShadow: '0 0 8px hsl(var(--primary))' },
					'100%': { transform: 'translateX(10px) scale(0)', opacity: '0', boxShadow: '0 0 0px hsl(var(--primary))' }
				},
				'circuit-trace': {
					'0%': { backgroundPosition: '0% 0%' },
					'100%': { backgroundPosition: '100% 100%' }
				},
				'radar-sweep': {
					'0%': { transform: 'rotate(0deg)', opacity: '0.8' },
					'100%': { transform: 'rotate(360deg)', opacity: '0.8' }
				},
				'digital-noise': {
					'0%, 100%': { opacity: '0.1' },
					'50%': { opacity: '0.3' }
				},
				'network-pulse': {
					'0%': { transform: 'scale(1)', opacity: '1' },
					'50%': { transform: 'scale(1.1)', opacity: '0.7' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'scan-line': {
					'0%': { transform: 'translateY(-100%)', opacity: '0' },
					'10%': { opacity: '1' },
					'90%': { opacity: '1' },
					'100%': { transform: 'translateY(100%)', opacity: '0' }
				},
				'matrix-rain': {
					'0%': { transform: 'translateY(-100%)', opacity: '1' },
					'100%': { transform: 'translateY(100vh)', opacity: '0' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'flow-right': 'flow-right 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
				'flow-left': 'flow-left 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite',
				'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
				'data-packet': 'data-packet 2s ease-in-out infinite',
				'circuit-trace': 'circuit-trace 4s linear infinite',
				'radar-sweep': 'radar-sweep 4s linear infinite',
				'digital-noise': 'digital-noise 1s ease-in-out infinite alternate',
				'network-pulse': 'network-pulse 1.5s ease-in-out infinite',
				'scan-line': 'scan-line 3s linear infinite',
				'matrix-rain': 'matrix-rain 8s linear infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
