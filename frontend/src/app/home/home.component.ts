import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
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

  options = [];

  searchBoxAddress = "";

  searchAddress = debounce(this.searchOSMApi, 500);
  
  selectedAddress: OSMPlace | undefined;

  constructor(private http: HttpClient) { }

  async searchOSMApi(){
    this.selectedAddress = undefined;
    this.osmResults = await this.http.get<OSMPlace[]>("https://nominatim.openstreetmap.org/search?format=json&q="+this.searchBoxAddress).toPromise();
  }

  selectAddress(res: OSMPlace){
    this.selectedAddress = res;
    this.searchBoxAddress = res.display_name;
    this.searchAddress.clear();
    console.log(res)
    const circle = leaflet.circle([res.lat, res.lon], {radius: 200}).addTo(this.map);
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  map: any;

  initMap(): void {
    this.map = leaflet.map('map', {
      center: [ 37.71, -122.435 ],
      zoom: 12
    });

    const tiles = leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    tiles.addTo(this.map);
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