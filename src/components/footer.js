import { format } from 'date-fns';
import { Box, Typography } from '@mui/material';

export default function Footer() {
  const currentYear = format(Date.now(), 'yyyy');

  return (
    <footer>
      <Box display="flex" justifyContent="center" alignItems="center">
        <Typography variant="caption" sx={{ textAlign: 'center' }}>
          Copyright &copy; {currentYear} Flavor Stash Matcher
        </Typography>
      </Box>
    </footer>
  );
}
