const express = require('express');
const app = express();
const port = 3000;
const axios = require('axios');

const dotenv = require('dotenv');
dotenv.config();
const appId = process.env.APP_ID;
const hash = process.env.HASH;

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get("/http", async (req,res) => {
  const response = await axios('https://api.sampleapis.com/baseball/hitsSingleSeason/');
  const data = response.data;
  //Here you would probably send send your data off to another function.
  res.send(data);
});

app.get("/test", async (req,res) => {
  const response = await tradeAreaTrips("37.734%7C-122.47", "%3E%3D2020-12-01T00%3A00");
  // const response = await fetchToken();
  console.log(response);
  //Here you would probably send send your data off to another function.
  res.send(response);
});





app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

async function fetchToken() {
  const axiosConfig = {
    headers: {
      "content-type": "application/json",
      Accept: "application/json",
    },
  };

  const tokenRes = await axios
    .get("https://api.iq.inrix.com/auth/v1/appToken?appId="+process.env.APP_ID+"&hashToken="+process.env.HASH, axiosConfig)
    .then((response) => {
      // if (response.status === 200) {
      // this.accessToken = response.data;
      console.log(response.data);
      return "Bearer "+response.data.result.token;
      // }
    })
    .catch((error) => {
      console.error("An error occured: ", error);
      // return error.message;
      throw "error";
    });
  return tokenRes;
}

async function tradeAreaTrips(point, startDate) {
  const axiosConfig = {
    headers: {
      "content-type": "application/json",
      "Accept": "application/json",
      "Authorization": await fetchToken(),
    }
  }

  let od: string = "destination";
  let geoFilterType: string = "circle";
  let radius: string = "200ft";
  //point is given
  let limit: number = 100;
  let provider: string = "consumer";
  //start date is given
  let endDate: string = "%3C%3D2020-12-31T00%3A00";
  let endPointType: number = 3;
  //tripLength is given

  const tripsResponse = await axios
      .get("https://api.iq.inrix.com/v1/trips?"+
      "od="+od+"&geoFilterType="+geoFilterType+
      "&radius="+radius+"&points="+point+
      "&limit="+limit.toString()+"&startDateTime="+startDate+"&endDateTime="+endDate+"&endpointType=3",axiosConfig)
      // .get("https://api.iq.inrix.com/v1/trips?od="+od+"&geoFilterType="+geoFilterType+"&points="+point+"&limit="+limit
      // +"&providerType="+provider+"&startDateTime="+startDate+"&endDateTime="+endDate+"&endpointType=3", axiosConfig)
      .then((response) => {
          return response.data;
      })
      .catch((error) => {
          console.error("An error occured: ", error);
          throw "error";
      });
  
  return tripsResponse;
}






interface FrontendRequest{
  destinationLat: number;
  destinationLon: number;
  timeRange: 1 | 3 | 6 | 12;
  radius: 5 | 10 | 25 | 50 | 100;
}

interface Result{
  timestamp: Date;
  destLat: number;
  destLon: number;
  boxes: Box[];
}

interface Box{
  lat1: number;
  lat2: number;
  lon1: number;
  lon2: number;

  data: BoxData[];
}

interface BoxData{
  startDate: Date;
  endDate: Date;
  numberOfVisits: number;
}