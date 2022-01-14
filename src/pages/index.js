import MixerList from '../components/mixer-list';

const IndexPage = () => {
  return (
    <main>
      <title>Flavor Stash Matchup</title>
      <h1>Welcome to the Flavor Stash Matchup!</h1>
      <p>
        This tool allows you to see what flavorings are shared in common for
        multiple mixers, based on their AllTheFlavors.com stash lists.
      </p>
      <MixerList />
    </main>
  );
};

export default IndexPage;
