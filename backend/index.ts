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


function initializeBoxes(radius, location){ //location contains longitude and latitude from address
  let boxes:Box[][] = [];
  let r=0;
  let c=0;
  for (let x=radius*-1;x<radius;x+=1){
    boxes.push([]);
    for(let y=radius*-1;y<radius;y+=1){
      let lat1=distanceCoord(x-.5,location,90)[0];
      let long1=distanceCoord(y-.5,location,180)[1];
      let lat2=distanceCoord(x+.5,location,90)[0];
      let long2=distanceCoord(y+.5,location,180)[1];
      boxes[r][c]={
        lat1:lat1,
        lat2:lat2,
        lon1:long1,
        lon2:long2,
        data: []
        
      };    
       c++;
     }
     r++;
  }
  return boxes;
}

function distanceCoord(dist, curLoc, brng){
  var RofE = 6378.1; //radius of the earth in km
  var distkm = dist/0.907; //converts distance to km for calculation
  var tempLat = curLoc[0] * (Math.PI/180);
  var tempLong = curLoc[1] * (Math.PI/180);
  brng = brng * (Math.PI/180);

  var newlat = Math.asin(Math.sin(tempLat) * Math.cos(distkm/RofE) + Math.cos(tempLat) * Math.sin(distkm/RofE)*Math.cos(brng));
  var newlong = tempLong + Math.atan2(Math.sin(brng)*Math.sin(distkm/RofE)*Math.cos(tempLat), Math.cos(distkm/RofE)-Math.sin(tempLat)*Math.sin(newlat));

  newlat = newlat * (180/Math.PI);
  newlong = newlong *(180/Math.PI);

  var newLoc = [newlat, newlong];
  return newLoc ;
}

function processDayData(data,boxes,dayNum){ //pass in call of a single day's worth of data, will process and update box
  initializeDay(boxes, dayNum,data[0].startDateTime);
  var minLong = boxes[0][0].lon1;
  var maxLat = boxes[0][0].lat1;
  var maxLong = boxes[boxes.length-1][boxes.length-1].lon2;
  var minLat = boxes[boxes.length-1][boxes.length-1].lat2;
  var boxLat = (maxLat - minLat)/boxes.length;
  var boxLong = (maxLong - minLong)/boxes.length;
  for(let d of data){
    var row = Math.floor((d.startloc[0] - minLat)/boxLat);
    var column = Math.floor((d.startloc[1] - minLong)/boxLong);
    boxes[row][column].boxData[dayNum].numberOfVisits++;
  }
}

function initializeDay(boxes: Box[][], dayNum,dayVal){
  var i = 0;
  var j = 0;
  while(i < boxes.length)
  {
    while(j < boxes[i].length)
    {
      boxes[i][j].data[dayNum]={
        startDate:dayVal,
        numberOfVisits:0,
      };
      j++;
    }
    i++;
  }
}

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})


interface FrontendRequest{
  address: string,
  timeRange: 1 | 3 | 6 | 12,
  radius: 5 | 10 | 25 | 50 | 100,
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
  numberOfVisits: number;
}
