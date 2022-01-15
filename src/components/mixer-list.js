import axios from 'axios';
import { Formik, Field, FieldArray, Form } from 'formik';
import { intersectionBy } from 'lodash';
import { useCallback, useState } from 'react';

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
            vendor: rawFlavorData.vendor.name
          };
        });
        results.push.apply(results, flavorData);
        return await getPages(mixer, page + 1, results);
      }
    },
    [mixerFlavors]
  );

  const handleSubmit = async (values) => {
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
  };

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

  const displayResults = !atfError && completed;
  const displayError = atfError && completed;

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
            {distinctFlavors.map((flavor, index) => (
              <div key={index}>
                Id: {flavor.id} Name: {flavor.name} Vendor: {flavor.vendor}{' '}
                Abbr: {flavor.vendorAbbr}
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
