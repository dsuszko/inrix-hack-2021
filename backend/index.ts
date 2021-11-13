const express = require('express');
const app = express();
const port = 3000;
const axios = require('axios');

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
  address: string,
  timeRange: 1 | 3 | 6 | 12,
  radius: 15 | 25 | 50 | 100,
}