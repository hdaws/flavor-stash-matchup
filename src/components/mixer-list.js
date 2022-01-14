import React, { useState } from 'react';
import { Formik , Field, FieldArray,  Form } from 'formik';
import axios from 'axios';
import {forEach, map, intersectionBy} from 'lodash';

//TODO showing mixer names and such is broken. use state?
//TODO implement reset button to wipe all names from form.

const MixerList = () => {
    const MIN_MIXERS = 2;
    const MAX_MIXERS = 10;
    const initialValues = { mixers: ['', '']} ;
    let mixerNames = [];
    const [mixerData, setMixerData] = useState({});
    const [flavorSet, setFlavorSet] = useState([]);
    const [listSubmitted, setListSubmitted] = useState(false);
    const [atfError, setAtfError] = useState(false);

    const getMixersData = (values) => {
        setListSubmitted(false);
        setAtfError(false);
       let mixerPromises = [];
       let data = {...mixerData};

       mixerNames = values.mixers;

        forEach(values.mixers, (mixer)=>{
            mixerPromises.push(getUserData(mixer));
        })
        return Promise.allSettled(mixerPromises).then((resultsArray)=>{
            forEach(resultsArray, (result)=>{
                if(result.status === 'fulfilled'){
                    data[result.value.mixer] = result.value.mixerFlavorData;
                }
                else {
                    setAtfError(true);
                }
            })
            setMixerData(data);
            calculateSetIntersection(data);
        })
    };

    const calculateSetIntersection = (data) => {
       let flavorSet = data[mixerNames[0]];
        for (let i = 1; i < mixerNames.length; i++) {
            flavorSet = intersectionBy(flavorSet, data[mixerNames[i]], 'id')
        }
        setFlavorSet(flavorSet);
        setListSubmitted(true);
    }

    //Check the state to see if we already got and processed the user data.
    const getUserData = (mixer)=>{
        if(mixerData[mixer]){
            return Promise.resolve({mixer, mixerFlavorData: mixerData[mixer]})
        }
        return getAllMixerData(mixer)
    }

    //TODO fix linter error and understand why the moreData and currpage cause issues.
    async function getAllMixerData(mixer){
        let currPage = 1;
        let moreData = true;
        let mixerFlavorData = [];
        while(moreData){
            await axios.get(`https://alltheflavors.com/api/v2/users/${mixer}/flavors?page[number]=${currPage}&page[size]=100`).then(function (atfResponse){
                if(atfResponse.data.length === 0){
                    moreData = false;
                    return;
                }
                currPage++;
                let flavorData = map(atfResponse.data, (rawFlavorData)=>{
                    return {id: rawFlavorData.id,
                        name: rawFlavorData.name,
                        vendorAbbr: rawFlavorData.vendor.abbreviation,
                        vendor: rawFlavorData.vendor.name
                    }
                })
                mixerFlavorData.push(...flavorData);
            })
        }
        return {
            mixer,
            mixerFlavorData
        };
    }

    const validate = values => {
        const errors = {};
        forEach(values.mixers, (mixer, index)=>{
            if(!mixer) {
                if(!errors.mixers){
                    errors.mixers = [];
                }
                errors.mixers[index] = 'Required';
            }
        })
        return errors;
    }

    return(
        <div>
            <p> Compare Mixer Stashes </p>
            <Formik
                initialValues = {initialValues}
                validate={validate}
                onSubmit = {getMixersData}>
                {({
                  values,
                  touched,
                  errors,
                  isSubmitting}) => (
                 <Form>
                     <FieldArray name="mixers">
                         {({remove, push})=>(
                             <div>
                                 <div>
                                      {values.mixers.length > 0 && values.mixers.map((mixer,index) =>
                                           (
                                              <div key={index}>
                                                  <label htmlFor={`mixers.${index}`}>UserName: </label>
                                                  <Field name={`mixers.${index}`} type="text"/>
                                                  {values.mixers.length > MIN_MIXERS && <button type="button" onClick={()=> remove(index)}>X</button>}
                                                  {errors.mixers && errors.mixers[index] && touched.mixers && touched.mixers[index] && <span>{errors.mixers[index]}</span>}
                                              </div>
                                          )
                                      )}
                                 </div>
                                 <div>
                                   <button type="button" disabled={(values.mixers.length >=MAX_MIXERS)} onClick={()=> push('')}>Add Mixer</button>
                                 </div>
                             </div>
                         )}
                     </FieldArray>
                    <button disabled={isSubmitting} type="submit">Submit</button>
                     <button disabled={isSubmitting} type="button">Reset</button>
                 </Form>
                )}
            </Formik>
            <div>
                {(!atfError && flavorSet.length > 0 && listSubmitted &&
                        <div>
                            {mixerNames.map((name)=>(
                                <div key={name}>
                                    Name: {name}, Number of Flavors: {mixerData[name].length}
                                </div>
                            ))}
                            <div> There are {flavorSet.length} flavors in common between all mixers </div>
                            { flavorSet.map((flavor, index) => (
                                <div key={index}>
                                    Id: {flavor.id} Name: {flavor.name} Vendor: {flavor.vendor} Abbr: {flavor.vendorAbbr}
                                </div>
                                ))}
                        </div>
                    )}
                {!atfError && flavorSet.length === 0 && listSubmitted && <h1> No Flavors in Common!</h1>}
                {atfError && listSubmitted && <h1>Could not retrieve mixer data from ATF! Please try again later.</h1>}
            </div>
        </div>
    )
}

export default MixerList