import axios from 'axios';
import { Formik, FieldArray, Form } from 'formik';
import { intersectionBy } from 'lodash';
import { useCallback, useState } from 'react';
import MixerResults from './mixer-results';
import {
  IconButton,
  Button,
  Container,
  Typography,
  TextField,
  Box,
  Paper,
  Chip,
  Stack
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import Link from '@mui/material/Link';

const MIN_MIXERS = 2;
const MAX_MIXERS = 10;

const MixerList = () => {
  const initialValues = { mixers: ['', ''] };
  const [mixerNames, setMixerNames] = useState([]);
  const [mixerFlavors, setMixerFlavors] = useState({});
  const [distinctFlavors, setDistinctFlavors] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [atfError, setAtfError] = useState(false);

  const getPage = useCallback(
    async (mixer, page) =>
      (
        await axios.get(
          `https://alltheflavors.com/api/v2/users/${mixer}/flavors?page[number]=${page}&page[size]=100`
        )
      ).data,
    []
  );

  const getPages = useCallback(
    async (mixer, page = 1, results = []) => {
      //Check the state to see if we already got and processed the user data.
      if (mixerFlavors[mixer]) {
        return {
          mixer,
          flavors: mixerFlavors[mixer]
        };
      }

      const flavors = await getPage(mixer, page);

      if (flavors.length === 0) {
        console.log(
          `Completed crawl of ${mixer}, they have ${results.length} flavors`
        );
        return {
          mixer,
          flavors: results
        };
      } else {
        let flavorData = flavors.map((rawFlavorData) => {
          return {
            id: rawFlavorData.id,
            name: rawFlavorData.name,
            vendorAbbr: rawFlavorData.vendor.abbreviation,
            slug: rawFlavorData.slug
          };
        });
        results.push.apply(results, flavorData);
        return await getPages(mixer, page + 1, results);
      }
    },
    [mixerFlavors]
  );

  const handleSubmit = useCallback(
    async (values) => {
      setCompleted(false);
      setAtfError(false);
      setMixerNames(values.mixers);

      const results = await Promise.allSettled(
        values.mixers.map((mixer) => getPages(mixer))
      );
      const [rejection] = results.filter(
        (result) => result.status === 'rejected'
      );

      if (rejection) {
        setAtfError(true);
      } else {
        const values = results.map(({ value }) => value);
        let mixerData = { ...mixerFlavors };

        values.forEach(({ mixer, flavors }) => {
          mixerData[mixer] = flavors;
        });

        setMixerFlavors(mixerData);
        setDistinctFlavors(
          values
            .map(({ flavors }) => flavors)
            .reduce((a, b) => intersectionBy(a, b, 'id'))
        );
      }
      setCompleted(true);
    },
    [
      mixerFlavors,
      setMixerFlavors,
      setDistinctFlavors,
      setCompleted,
      setAtfError,
      setMixerNames
    ]
  );

  const displayResults = !atfError && completed;
  const displayError = atfError && completed;

  return (
    <Container maxWidth="xl">
      <Stack sx={{ maxWidth: '75%' }}>
        <Paper sx={{ mb: 2, mt: 2, p: 2 }}>
          <Typography style={{ fontWeight: 600 }} variant="h6" sx={{ mb: 2 }}>
            {' '}
            Compare Mixer Stashes{' '}
          </Typography>
          <Formik initialValues={initialValues} onSubmit={handleSubmit}>
            {({ values, resetForm, isSubmitting, handleChange }) => (
              <Form>
                <p>
                  This tool allows you to see what flavorings are shared in
                  common for for multiple mixers, based on their{' '}
                  <Link
                    href="https://alltheflavors.com"
                    target="_blank"
                    rel="noopener"
                  >
                    AllTheFlavors.com
                  </Link>{' '}
                  stash lists.
                </p>
                <FieldArray name="mixers">
                  {({ remove, push }) => (
                    <div>
                      <div>
                        {values.mixers.length > 0 &&
                          values.mixers.map((mixer, index) => (
                            <Box
                              key={index}
                              sx={{
                                display: 'flex',
                                mb: 1,
                                alignItems: 'center'
                              }}
                            >
                              <TextField
                                value={values.mixers[index]}
                                onChange={handleChange}
                                label="Mixer Name"
                                required
                                name={`mixers.${index}`}
                                type="text"
                              />
                              {values.mixers.length > MIN_MIXERS && (
                                <IconButton
                                  color="error"
                                  type="button"
                                  onClick={() => remove(index)}
                                >
                                  <ClearIcon />
                                </IconButton>
                              )}
                            </Box>
                          ))}
                      </div>
                      <div>
                        <Button
                          variant="contained"
                          type="button"
                          disabled={values.mixers.length >= MAX_MIXERS}
                          onClick={() => push('')}
                        >
                          Add Mixer
                        </Button>
                      </div>
                    </div>
                  )}
                </FieldArray>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    pl: 2,
                    pr: 2,
                    pt: 2
                  }}
                >
                  <Button
                    sx={{ m: 0.5 }}
                    color="success"
                    variant="contained"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    Submit
                  </Button>
                  <Button
                    sx={{ m: 0.5 }}
                    variant="contained"
                    disabled={isSubmitting}
                    type="button"
                    onClick={() => resetForm(initialValues)}
                  >
                    Reset
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        </Paper>
        <div>
          {displayResults && distinctFlavors.length > 0 && (
            <div>
              {mixerNames.map((name) => (
                <Chip
                  key={name}
                  label={`${name}: ${mixerFlavors[name].length} Flavors`}
                />
              ))}
              <div>
                {' '}
                There are {distinctFlavors.length} flavors in common between all
                mixers{' '}
              </div>
              <MixerResults data={distinctFlavors} />
            </div>
          )}
          {displayResults && distinctFlavors.length === 0 && (
            <h1> No Flavors in Common!</h1>
          )}
          {displayError && (
            <h1>
              Could not retrieve mixer data from ATF! Please try again later.
            </h1>
          )}
        </div>
      </Stack>
    </Container>
  );
};

export default MixerList;
