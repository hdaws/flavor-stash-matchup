import PropTypes from 'prop-types';
import { AppBar, Toolbar, Typography } from '@mui/material';

const Header = ({ siteTitle = '' }) => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h4">{siteTitle}</Typography>
      </Toolbar>
    </AppBar>
  );
};

Header.propTypes = {
  siteTitle: PropTypes.string
};

export default Header;
