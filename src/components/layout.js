import PropTypes from 'prop-types';
import { useStaticQuery, graphql } from 'gatsby';
import { Fragment } from 'react';
import Header from './header';
import Footer from './footer';
import { CssBaseline } from '@mui/material';

const Layout = ({ children }) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `);

  return (
    <Fragment>
      <CssBaseline />
      <Header siteTitle={data.site.siteMetadata.title} />
      <main>{children}</main>
      <Footer />
    </Fragment>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired
};

export default Layout;
