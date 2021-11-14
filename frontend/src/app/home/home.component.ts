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

  timeRange: Range[] = [
    {value: 1, display: "Last month"},
    {value: 3, display: "Last 3 months"},
    {value: 6, display: "Last 6 months"},
    {value: 12, display: "Last year"},
  ];

  radius: number[] = [5,10,25,50,100];
  osmResults: OSMPlace[] | undefined = [];

  dateData: Box[][] = [];

  options = [];

  searchBoxAddress = "";

  searchAddress = debounce(this.searchOSMApi, 500);
  
  selectedAddress: OSMPlace | undefined;

  constructor(private http: HttpClient) {

  }

  async searchOSMApi(){
    this.selectedAddress = undefined;
    this.osmResults = await this.http.get<OSMPlace[]>("https://nominatim.openstreetmap.org/search?format=json&q="+this.searchBoxAddress).toPromise();
  }

  points: any[] = [];

  showComparion = false;

  async getDateData(lat:string,lon:string){
    const radius = 5;
    const boxSize = 0.5;
    this.dateData = await this.http.get<Box[][]>(
      "http://localhost:3000/getTripsByDate?lat="+lat+"&lon="+lon
      +"&radius="+radius.toString()+"&boxSize="+boxSize.toString()
      ).toPromise() ?? [];
    
    
    for(let p of this.points){
      this.map.removeLayer(p);
    }
    this.points = [];
    for(let row of (this.dateData ?? [])){
      for(let box of row){
        let count = box.data.map(e => e.numberOfVisits).reduce((a, b) => a + b);
        let color;
        if(count==0){
          color = this.hslToHex(0,100,50);
          continue;
        } else if(count==1){
          color = '#1fff9e'
          // color = "#1bf1ea"
          // color = this.hslToHex(20,100,50);
        }
        else if(count<=3){
          color = '#0abeff'
          // color = "#1b8fee"
          // color = this.hslToHex(40,100,50);
        }
        else if(count<=6){
          color='#000eff'
          // color = "#2b1bf2"
          // color = this.hslToHex(60,100,50);
        }
        else if(count<=10){
          color='#a000ff'
          // color = "#9d15ec"
          // color = this.hslToHex(80,100,50);
        }
        else{
          color='#ff1f69'
          // color = "#f518d8"
          // color = this.hslToHex(100,100,50);
        }
        console.log(count,color);
        let rect = leaflet.rectangle([box.p1,box.p2], {color: color, weight: 1, stroke: false, fillOpacity: 0.4})
        .bindTooltip(count.toString()+" visited between Dec 1st and 31st in 2020");
        rect.on("click",() => {
          console.log(box);
        });
        this.points.push(rect);
        rect.addTo(this.map);
      }
      // const marker = leaflet.marker([this.selectedAddress?.lat ?? 0, this.selectedAddress?.lon ?? 0]);
      const circle = leaflet.circle([this.selectedAddress?.lat ?? 0, this.selectedAddress?.lon ?? 0], {color: "#ffffff", radius: 100});
      this.points.push(circle);
      circle.addTo(this.map);
    }
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

interface Range{
  value: number;
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
