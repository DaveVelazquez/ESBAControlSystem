import React from 'react';
import { Box, Typography } from '@mui/material';

const Tracking: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Tracking en Tiempo Real
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Mapa de tracking con Mapbox en desarrollo...
      </Typography>
    </Box>
  );
};

export default Tracking;
