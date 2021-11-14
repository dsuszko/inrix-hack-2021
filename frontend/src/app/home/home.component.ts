import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import * as debounce from "debounce";
import * as leaflet from 'leaflet';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit {

  displayOptions: DisplayOption[] = [
    {value: false, display: "Raw data"},
    {value: true, display: "Change"},
  ];

  radius: number[] = [5,10,25,50,100];
  osmResults: OSMPlace[] | undefined = [];

  dateData: Box[][] = [];

  options = [];

  searchBoxAddress = "";

  searchAddress = debounce(this.searchOSMApi, 500);
  
  selectedAddress: OSMPlace | undefined;

  constructor(private http: HttpClient) {
    this.showComparion = false;
  }

  async searchOSMApi(){
    this.selectedAddress = undefined;
    this.osmResults = await this.http.get<OSMPlace[]>("https://nominatim.openstreetmap.org/search?format=json&q="+this.searchBoxAddress).toPromise();
  }

  points: any[] = [];

  updateComparison(){
    console.log(this.showComparion);
    if(this.showComparion){
      this.comparisonMap();
    }
    else{
      this.rawDataMap();
    }
  }

  showComparion: boolean = false;

  async getDateData(lat:string,lon:string){
    const radius = 5;
    const boxSize = 0.5;
    this.dateData = await this.http.get<Box[][]>(
      "http://localhost:3000/getTripsByDate?lat="+lat+"&lon="+lon
      +"&radius="+radius.toString()+"&boxSize="+boxSize.toString()
      ).toPromise() ?? [];
    if(this.showComparion){
      this.comparisonMap();
    }
    else{
      this.rawDataMap();
    }
  }

  comparisonMap(){
    for(let p of this.points){
      this.map.removeLayer(p);
    }
    this.points = [];
    for(let row of (this.dateData ?? [])){
      for(let box of row){
        let half = Math.floor(box.data.length/2);
        let first = box.data.slice(0,half).map(e => e.numberOfVisits).reduce((a, b) => a + b);
        let second = box.data.slice(half).map(e => e.numberOfVisits).reduce((a, b) => a + b);
        let rawDif = second - first;
        let color;
        let percentDif = 0;
        let colors = [
          '#ff211f',//red
          '#ff961f',//purple
          '#f5ff1f',//yellow
          '#60f42a',//green
          '#0ae7ff',//light-blue
        ];
        // let colors = [
        //   '#ff292d',//red
        //   '#f8961e',//orange
        //   '#ffe81a',//yellow
        //   '#80e931',//green
        //   '#32c3b7',//light-blue
        // ];
        // let colors = [
        //   '#ffe01f',//yellow
        //   '#ff931f',//orange
        //   '#ff1f44',//red
        //   '#ff19fb',//pink
        //   '#961fff',//purple
        // ];
        if((first==0 && second==0) || (first==1 && second==0) || (first==0 && second==1)){
          continue;
        } else if(first==0){
          percentDif = 1;
          color = colors[4]
        }
        else{
          percentDif = rawDif/first;
          if(percentDif==0){
            color=colors[2]
          }
          else if(percentDif>=1){
            color = colors[4];
          }
          else if(percentDif>0){
            color = colors[3];
          }
          else if(percentDif>-1){
            color = colors[1];
          }
          else{
            color = colors[0];
          }
        }
        percentDif = Math.floor(percentDif * 100);
        let rect = leaflet.rectangle([box.p1,box.p2], {color: color, weight: 1, stroke: false, fillOpacity: 0.4})
        .bindTooltip(percentDif.toString()+"% change from 12/1-12/15 and 12/16-12/31");
        rect.on("click",() => {
          console.log(box);
        });
        this.points.push(rect);
        rect.addTo(this.map);
      }
    }
    const circle = leaflet.circle([this.selectedAddress?.lat ?? 0, this.selectedAddress?.lon ?? 0], {color: "#ffffff", radius: 100, fillOpacity: 1});
    this.points.push(circle);
    circle.addTo(this.map);
  }

  rawDataMap(){
    for(let p of this.points){
      this.map.removeLayer(p);
    }
    this.points = [];
    for(let row of (this.dateData ?? [])){
      for(let box of row){
        let count = box.data.map(e => e.numberOfVisits).reduce((a, b) => a + b);
        let color;
        let colors = [
          '#1fff9e',//#1bf1ea
          '#0abeff',//#1b8fee
          '#000eff',//#2b1bf2
          '#a000ff',//#9d15ec
          '#ff1f69',//#f518d8
        ];
        if(count==0){
          continue;
        } else if(count==1){
          color = colors[0]
        }
        else if(count<=3){
          color = colors[1]
        }
        else if(count<=6){
          color=colors[2]
        }
        else if(count<=10){
          color=colors[3]
        }
        else{
          color=colors[4]
        }
        let rect = leaflet.rectangle([box.p1,box.p2], {color: color, weight: 1, stroke: false, fillOpacity: 0.4})
        .bindTooltip(count.toString()+" visited between Dec 1st and 31st in 2020");
        rect.on("click",() => {
          console.log(box);
        });
        this.points.push(rect);
        rect.addTo(this.map);
      }
    }
    const circle = leaflet.circle([this.selectedAddress?.lat ?? 0, this.selectedAddress?.lon ?? 0], {color: "#ffffff", radius: 100, fillOpacity: 1});
    this.points.push(circle);
    circle.addTo(this.map);
  }

  selectAddress(res: OSMPlace){
    for(let p of this.points){
      this.map.removeLayer(p);
    }
    this.points = [];
    this.selectedAddress = res;
    this.searchBoxAddress = res.display_name;
    this.searchAddress.clear();
    console.log(res);
    this.getDateData(res.lat.toString(),res.lon.toString());
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  map: any;

  initMap(): void {
    this.map = leaflet.map('map', {
      center: [ 37.77, -122.435 ],
      zoom: 12
    });

    const tiles = leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    tiles.addTo(this.map);
  }

  hslToHex(h: number, s:number, l:number) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n:number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

}

interface DisplayOption{
  value: boolean;
  display: string;
}

interface OSMPlace{
  place_id: number;
  licence:string;
  osm_type: string;
  osm_id:number;
  lat:number;
  lon:number;
  display_name:string;
  class: string;
  type:number;
  importance:number;
}

interface Box{
  p1: leaflet.LatLngTuple;
  p2: leaflet.LatLngTuple;

  data: BoxData[];
}

interface BoxData{
  startDate: Date;
  numberOfVisits: number;
}

//Test locations
//211 Valencia St - Burma Love (Burmese restaurant)
//99 Grove Street - Civic Center
//1 Telegraph Hill Blvd - Coit Tower
//24 Willie Mays Plaza - Oracle Park
//1 Warriors Way - Chase Center
