import MixerList from '../components/mixer-list';
import Layout from '../components/layout';

const IndexPage = () => {
  return (
    <Layout>
      <p>
        This tool allows you to see what flavorings are shared in common for
        multiple mixers, based on their AllTheFlavors.com stash lists.
      </p>
      <MixerList />
    </Layout>
  );
};

export default IndexPage;
