import MixerList from '../components/mixer-list';
import Layout from '../components/layout';
import { ThemeProvider, useTheme } from '@mui/material/styles';

const IndexPage = () => {
  const theme = useTheme();

  return (
    <ThemeProvider theme={theme}>
      <Layout>
        <MixerList />
      </Layout>
    </ThemeProvider>
  );
};

export default IndexPage;
