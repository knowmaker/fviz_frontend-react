import axios from 'axios';

export function getDataFromAPI(adress, headers = undefined) {
  return new Promise(async function(resolve) {
    try {
      const response = await axios.get(adress, {headers: headers})
      //console.log(adress,headers,response)
      resolve(response)
    } catch (error) {
      resolve(error.response)
    }
  })
}

export function postDataToAPI(adress,data, headers = undefined) {
  return new Promise(async function(resolve) {
    try {
      const response = await axios.post(adress, data, {headers: headers})
      console.log(adress,headers,response)
      resolve(response)
    } catch (error) {
      resolve(error.response)
      console.log(adress,data, headers)
    }
  })
}

export function putDataToAPI(adress,data, headers = undefined) {
  return new Promise(async function(resolve) {
    try {
      const response = await axios.put(adress, data, {headers: headers})
      resolve(response)
    } catch (error) {
      resolve(error.response)
    }
  })

}

export function patchDataToAPI(adress,data, headers = undefined) {
  return new Promise(async function(resolve) {
    try {
      const response = await axios.patch(adress, data, {headers: headers})
      resolve(response)
    } catch (error) {
      resolve(error.response)
    }
  })

}

export function deleteDataFromAPI(adress, data, headers = undefined) {
  return new Promise(async function(resolve) {
    try {
      const response = await axios.delete(adress, { headers, data });
      resolve(response);
    } catch (error) {
      resolve(error.response);
    }
  });
}

export function getAllCellDataFromAPI(cells, headers) {

  const requests = cells.map(cell => axios.get(`${process.env.REACT_APP_API_LINK}/quantities/${cell}`, {headers: headers}));

  return new Promise(async function(resolve) {

    const responses = await Promise.allSettled(requests);
    resolve(responses.map(cellResponse => cellResponse.value));
  });

}

export default function setStateFromGetAPI(setStateFunction, adress, afterRequestFunction, headers, extraData) {

  axios
      .get(adress, {headers: headers})
      .then((response) => {
        const data = response.data;
        if (setStateFunction) {
          setStateFunction(data);
        }
        if (afterRequestFunction !== undefined) {
          afterRequestFunction(data, extraData, {adress: adress, headers: headers});
        }
        if (!setStateFunction) { return data; }
      })
      .catch((error) => {
        console.log("ERROR:", adress, headers);
      });

}

export function isResponseSuccessful(response) {
  if (response === undefined) { return false }
  if (response.status < 300) { return true }
  return false;
}

