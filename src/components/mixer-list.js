import React, { useState, useCallback } from 'react';
import { Formik , Field, FieldArray,  Form } from 'formik';
import axios from 'axios';
import {forEach} from 'lodash';

const MixerList = () => {
    const MIN_MIXERS = 2;
    const MAX_MIXERS = 5;
    const initialValues = { mixers: ["", ""]} ;
    const [mixerData, setMixerData] = useState([]);

    //TODO you better damn well validate before you get here stardust.
    //TODO also figure out how to properly use is submitting because it always disables the button.
    //TODO determine if usecallback is the right place here. useMemo may be more valid later or using caching on axios.
    const getMixerData = useCallback((values) => {
       let mixerPromises = [];
        forEach(values.mixers, (mixer)=>{
            mixerPromises.push(axios.get(`https://alltheflavors.com/users/${mixer}/flavors.json`))
        })
        return Promise.allSettled(mixerPromises).then((resultsArray)=>{
            forEach(resultsArray, (result)=>{
                console.error("HMD what is the result?", result);
                if(result.status === 'fulfilled'){
                    console.log("HMD got the data");
                }
            })
        })
    }, []);

    return(
        <div>
            <p> Compare Mixer Stashes </p>
            <Formik initialValues = {initialValues}
                onSubmit = {getMixerData}>
                {({
                 values,
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
                                              </div>
                                          )
                                      )}
                                 </div>
                                 <div>
                                   <button disabled={(values.mixers.length >=MAX_MIXERS)} onClick={()=> push('')}>Add Mixer</button>
                                 </div>
                             </div>
                         )}
                     </FieldArray>
                    <button type="submit">Submit</button>
                 </Form>
                )}
            </Formik>

        </div>
    )
}

export default MixerList