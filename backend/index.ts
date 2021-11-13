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
})





app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})


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