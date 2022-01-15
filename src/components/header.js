import PropTypes from 'prop-types';
import { AppBar, Container, Typography } from '@mui/material';

const Header = ({ siteTitle = '' }) => {
  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Typography variant="h4">{siteTitle}</Typography>
      </Container>
    </AppBar>
  );
};

Header.propTypes = {
  siteTitle: PropTypes.string
};

export default Header;
