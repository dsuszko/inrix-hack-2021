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

