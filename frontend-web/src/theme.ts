import { createTheme } from '@mui/material/styles';

// Responsive breakpoints
const breakpoints = {
  values: {
    xs: 0,      // Mobile
    sm: 600,    // Mobile landscape / Small tablet
    md: 900,    // Tablet
    lg: 1200,   // Desktop
    xl: 1536,   // Large desktop
  },
};

// Color palette - ESBA Consultores Theme
const palette = {
  primary: {
    main: '#0066cc',      // ESBA primary blue
    light: '#3385d6',
    dark: '#004c99',
    contrastText: '#fff',
  },
  secondary: {
    main: '#00a8e8',      // ESBA secondary blue
    light: '#33b9ed',
    dark: '#0089c2',
    contrastText: '#fff',
  },
  success: {
    main: '#2e7d32',
    light: '#4caf50',
    dark: '#1b5e20',
  },
  error: {
    main: '#d32f2f',
    light: '#ef5350',
    dark: '#c62828',
  },
  warning: {
    main: '#ed6c02',
    light: '#ff9800',
    dark: '#e65100',
  },
  info: {
    main: '#00509e',      // ESBA accent
    light: '#3373b5',
    dark: '#003d7a',
  },
  background: {
    default: '#f5f7fa',   // ESBA gray
    paper: '#ffffff',
  },
  text: {
    primary: '#2c3e50',   // ESBA dark text
    secondary: '#546e7a',
  },
};

// Typography
const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 600,
    '@media (max-width:600px)': {
      fontSize: '2rem',
    },
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    '@media (max-width:600px)': {
      fontSize: '1.75rem',
    },
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 600,
    '@media (max-width:600px)': {
      fontSize: '1.5rem',
    },
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 600,
    '@media (max-width:600px)': {
      fontSize: '1.25rem',
    },
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 600,
    '@media (max-width:600px)': {
      fontSize: '1.1rem',
    },
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
  },
  subtitle1: {
    fontSize: '1rem',
    lineHeight: 1.75,
  },
  subtitle2: {
    fontSize: '0.875rem',
    lineHeight: 1.57,
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.5,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.43,
  },
  button: {
    textTransform: 'none' as const,
    fontWeight: 500,
  },
};

// Component overrides
const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '8px 16px',
      },
      sizeSmall: {
        padding: '4px 12px',
      },
      sizeLarge: {
        padding: '12px 24px',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,
      },
    },
  },
};

const theme = createTheme({
  breakpoints,
  palette,
  typography,
  components,
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
});

export default theme;
