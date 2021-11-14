const express = require('express');
const app = express();
const port = 3000;
const axios = require('axios');
const fs = require('fs');
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();

const appId = process.env.APP_ID;
const hash = process.env.HASH;

app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get("/http", async (req,res) => {
  const response = await axios('https://api.sampleapis.com/baseball/hitsSingleSeason/');
  const data = response.data;
  //Here you would probably send send your data off to another function.
  res.send(data);
});

app.get("/getTripsByDate", async (req,res) => {

  let lat = Number(req.query.lat);
  let lon = Number(req.query.lon);
  let radius = Number(req.query.radius ?? "5");
  let boxSize = Number(req.query.boxSize ?? "0.5");
  let data = await fullWorkflow(lat,lon,radius,boxSize);
  //Here you would probably send send your data off to another function.
  res.send(data);
});

app.get("/rawInrix", async (req,res) => {
  //37.792137265306124%7C-122.4107742857143 data.json - random
  //37.778377%7C-122.418107 data2 - Bill Graham
  //37.778572%7C-122.389717 data3 - Oracle Park
  //37.8078%7C-122.4748 data4 - Golden Gate Welcome Center
  //?lat=37.7696206&lon=-122.4221812
  let response;
  try {
    let lat = Number(req.query.lat);
    let lon = Number(req.query.lon);
    response = await tradeAreaTrips(lat.toString()+"%7C"+lon.toString(), "%3E%3D2020-12-01T00%3A00");
    console.log("'I've got API locked... Fox 3, good tone.'");
    res.send(response);
  }
  catch (error) {
    console.log("CATCH (line 31): " + error);
    let text = fs.readFileSync("./exported/data1-0.json");
    let response = JSON.parse(text);
    res.json(JSON.stringify(response));
  }
  // const response = await fetchToken();
  // console.log(response);
});

function initializeBoxes(radius:number=10, location: number[],boxWidth:number=0.5){ //location contains longitude and latitude from address
  let boxes:Box[][] = [];
  let r=0;
  let c=0;
  for (let x=radius*-1;x<radius;x+=boxWidth){
    boxes.push([]);
    for(let y=radius*-1;y<radius;y+=boxWidth){
      let lat1=distanceCoord(x-boxWidth/2,location,0)[0];
      let long1=distanceCoord(y-boxWidth/2,location,90)[1];
      let lat2=distanceCoord(x+boxWidth/2,location,0)[0];
      let long2=distanceCoord(y+boxWidth/2,location,90)[1];
      boxes[r][c]={
        p1:[lat1,long1],
        p2:[lat2,long2],
        data: []
      };    
       c++;
    }
    c = 0;
    r++;
  }
  return boxes;
}

function distanceCoord(dist, curLoc: number[], brng){
  var R = 3958.8; //radius of the earth in km
  // var distkm = dist
  const lat1 = curLoc[0] * (Math.PI/180);
  const lon1 = curLoc[1] * (Math.PI/180);
  brng = brng * (Math.PI/180);

  let lat2 = Math.asin( Math.sin(lat1)*Math.cos(dist/R) +
     Math.cos(lat1)*Math.sin(dist/R)*Math.cos(brng))

  let lon2 = lon1 + Math.atan2(Math.sin(brng)*Math.sin(dist/R)*Math.cos(lat1),
             Math.cos(dist/R)-Math.sin(lat1)*Math.sin(lat2))

  // var newlat = Math.asin(Math.sin(tempLat) * Math.cos(dist/RofE) + Math.cos(tempLat) * Math.sin(dist/RofE)*Math.cos(brng));
  // var newlong = tempLong + Math.atan2(Math.sin(brng)*Math.sin(dist/RofE)*Math.cos(tempLat), Math.cos(dist/RofE)-Math.sin(tempLat)*Math.sin(newlat));

  lat2 = lat2 * (180/Math.PI);
  lon2 = lon2 *(180/Math.PI);

  return [lat2, lon2];
}

function processDayData(data,boxes,dayNum){ //pass in call of a single day's worth of data, will process and update box
  initializeDay(boxes, dayNum,data[0].startDateTime);
  let longs = [boxes[0][0].p1[1],boxes[boxes.length-1][boxes[boxes.length-1].length-1].p2[1]];
  let lats = [boxes[0][0].p1[0],boxes[boxes.length-1][boxes[boxes.length-1].length-1].p2[0]];
  var minLong = Math.min(...longs);
  var maxLong = Math.max(...longs);
  var maxLat = Math.max(...lats);
  var minLat = Math.min(...lats);
  // var minLong = boxes[0][0].p1[1];
  // var maxLat = boxes[0][0].p1[0];
  // var maxLong = boxes[boxes.length-1][boxes[boxes.length-1].length-1].p2[1];
  // var minLat = boxes[boxes.length-1][boxes[boxes.length-1].length-1].p2[0];
  var maxRow = boxes.length;
  var maxCol = boxes[boxes.length-1].length;
  var boxLat = Math.abs(maxLat - minLat)/boxes.length;
  var boxLong = Math.abs(maxLong - minLong)/boxes.length;
  // if(dayNum==0){
  //   console.log("MIN",minLat,minLong);
  //   console.log("MAX",maxLat,maxLong);
  //   console.log("BOX",boxLat,boxLong);
  // }
  for(let d of data){
    let lat = Number(d.startLoc.split(",")[0]);
    let lon = Number(d.startLoc.split(",")[1]);
    var row = Math.floor((lat - minLat)/boxLat);
    var column = Math.floor((lon - minLong)/boxLong);
    // console.log(row,column);
    // if(dayNum==0){
    //   console.log("DATA FOR BOX ",row, column);
    //   console.log(lat,lon);
    //   // console.log(boxes[row][column].p1,boxes[row][column].p2);
    // }
    if(row>=0 && row<maxRow && column>=0 && column<maxCol){
      boxes[row][column].data[dayNum].numberOfVisits++;
    }
  }
}

function initializeDay(boxes: Box[][], dayNum,dayVal){
  var i = 0;
  var j = 0;
  for(let row of boxes){
    for(let col of row){
      col.data[dayNum]={
        startDate:dayVal,
        numberOfVisits:0,
      };
    }
  }
}

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
      // console.log(response.data);
      return "Bearer "+response.data.result.token;
      // }
    })
    .catch((error) => {
      console.error("An error occured: ", error.message);
      // return error.message;
      throw "error";
    });
  return tokenRes;
}

async function tradeAreaTrips(point, startDate) {
  try{
    const axiosConfig = {
      headers: {
        "content-type": "application/json",
        "Accept": "application/json",
        "Authorization": await fetchToken(),
      }
    }

    let od: string = "destination";
    let geoFilterType: string = "circle";
    let radius: string = "500ft";
    //point is given
    let limit: number = 10000;
    let provider: string = "consumer";
    //start date is given
    startDate = "%3E%3D2020-12-01T00%3A00";
    let endDate: string = "%3C%3D2020-12-31T00%3A00";
    let endPointType: number = 3;
    //tripLength is given

    const tripsResponse = await axios
        .get("https://api.iq.inrix.com/v1/trips?"+
        "od="+od+"&geoFilterType="+geoFilterType+
        "&radius="+radius+"&points="+point+
        "&limit="+limit.toString()+"&startDateTime="+startDate+"&endDateTime="+endDate+"",axiosConfig)
        // .get("https://api.iq.inrix.com/v1/trips?od="+od+"&geoFilterType="+geoFilterType+"&points="+point+"&limit="+limit
        // +"&providerType="+provider+"&startDateTime="+startDate+"&endDateTime="+endDate+"&endpointType=3", axiosConfig)
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            console.error("An error occured: ", error.message);
            throw "error";
        });
    
    return tripsResponse;
  }
  catch(e){
    console.log(e);
    let text = fs.readFileSync("./exported/data1-0.json");
    return JSON.parse(text);
  }
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
  p1: number[];
  p2: number[];

  data: BoxData[];
}

interface BoxData{
  startDate: Date;
  numberOfVisits: number;
}

async function getDailyTripData(lat,lon){
  let result = await tradeAreaTrips(lat.toString()+"%7C"+lon.toString(), "%3E%3D2020-12-01T00%3A00");
  // let result = JSON.parse(fs.readFileSync("./exported/data4-0.json"));
  let arr = [];
  for(let d of result.data){
    let date: Date = new Date(d.startDateTime);
    const i = date.getDate() - 1;
    if(arr[i]==null){
      arr[i] = [];
    }
    arr[i].push(d);
  }
  return arr;
}

async function fullWorkflow(lat: number,lon: number,radius:number=5,boxSize:number=0.5){
  let boxes = initializeBoxes(radius,[lat,lon],boxSize);
  let dataByDate = await getDailyTripData(lat,lon);
  // console.log(dataByDate);
  for(let i=0; i<dataByDate.length; i++){
    processDayData(dataByDate[i],boxes,i);
  }
  return boxes;
}
// fullWorkflow(37.778377,-122.418107);