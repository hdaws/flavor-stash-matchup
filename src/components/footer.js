import { format } from 'date-fns';
import { Container, Typography } from '@mui/material';

export default function Footer() {
  const currentYear = format(Date.now(), 'yyyy');

  return (
    <footer>
      <Container>
        <Typography variant="caption" sx={{ textAlign: 'center' }}>
          Copyright &copy; {currentYear} Flavor Stash Matcher
        </Typography>
      </Container>
    </footer>
  );
}
