import axios from 'axios';
import { Formik, Field, FieldArray, Form } from 'formik';
import { intersectionBy } from 'lodash';
import { useCallback, useState } from 'react';

const MIN_MIXERS = 3;
const MAX_MIXERS = 10;

const MixerList = () => {
  const initialValues = { mixers: ['', '', ''] };
  const [mixerNames, setMixerNames] = useState([]);
  const [mixerFlavors, setMixerFlavors] = useState({});
  const [distinctFlavors, setDistinctFlavors] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(false);

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
        results.push.apply(results, flavors);
        return await getPages(mixer, page + 1, results);
      }
    },
    [mixerFlavors]
  );

  const handleSubmit = useCallback(
    async (values) => {
      setCompleted(false);
      setError(false);

      const results = await Promise.allSettled(
        values.mixers.map((mixer) => getPages(mixer))
      );
      const [rejection] = results.filter(
        (result) => result.status === 'rejected'
      );

      if (rejection) {
        setError(true);
      } else {
        const values = results.map(({ value }) => value);
        setMixerFlavors(
          Object.fromEntries(
            values.map(({ mixer, flavors }) => [mixer, flavors])
          )
        );
        setDistinctFlavors(
          values
            .map(({ flavors }) => flavors)
            .reduce((a, b) => intersectionBy(a, b, 'id'))
        );
      }
      setCompleted(true);
    },
    [setError, setCompleted, setMixerFlavors, setMixerNames, setDistinctFlavors]
  );

  const validate = useCallback((values) => {
    const errors = {};
    values.mixers.forEach((mixer, index) => {
      if (!mixer) {
        if (!errors.mixers) {
          errors.mixers = [];
        }
        errors.mixers[index] = 'Required';
      }
    });
    return errors;
  }, []);

  const displayResults = !error && completed;
  const displayError = error && completed;

  return (
    <div>
      <p> Compare Mixer Stashes </p>
      <Formik
        initialValues={initialValues}
        validate={validate}
        onSubmit={handleSubmit}
      >
        {({ values, touched, errors, resetForm, isSubmitting }) => (
          <Form>
            <FieldArray name="mixers">
              {({ remove, push }) => (
                <div>
                  <div>
                    {values.mixers.length > 0 &&
                      values.mixers.map((mixer, index) => (
                        <div key={index}>
                          <label htmlFor={`mixers.${index}`}>UserName: </label>
                          <Field name={`mixers.${index}`} type="text" />
                          {values.mixers.length > MIN_MIXERS && (
                            <button type="button" onClick={() => remove(index)}>
                              X
                            </button>
                          )}
                          {errors.mixers &&
                            errors.mixers[index] &&
                            touched.mixers &&
                            touched.mixers[index] && (
                              <span>{errors.mixers[index]}</span>
                            )}
                        </div>
                      ))}
                  </div>
                  <div>
                    <button
                      type="button"
                      disabled={values.mixers.length >= MAX_MIXERS}
                      onClick={() => push('')}
                    >
                      Add Mixer
                    </button>
                  </div>
                </div>
              )}
            </FieldArray>
            <button disabled={isSubmitting} type="submit">
              Submit
            </button>
            <button
              disabled={isSubmitting}
              type="button"
              onClick={() => resetForm(initialValues)}
            >
              Reset
            </button>
          </Form>
        )}
      </Formik>
      <div>
        {displayResults && distinctFlavors.length > 0 && (
          <div>
            {mixerNames.map((name) => (
              <div key={name}>
                Name: {name}, Number of Flavors: {mixerFlavors[name].length}
              </div>
            ))}
            <div>
              {' '}
              There are {distinctFlavors.length} flavors in common between all
              mixers{' '}
            </div>
            {distinctFlavors.map((flavor) => (
              <div key={flavor.id}>
                Id: {flavor.id} Name: {flavor.name} Vendor: {flavor.vendor.name}{' '}
                Abbr: {flavor.vendor.abbreviation}
              </div>
            ))}
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
    </div>
  );
};

export default MixerList;
