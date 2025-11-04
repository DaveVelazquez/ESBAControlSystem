import React from 'react';
import { Box, Typography } from '@mui/material';

const Technicians: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Técnicos
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Módulo de gestión de técnicos en desarrollo...
      </Typography>
    </Box>
  );
};

export default Technicians;
