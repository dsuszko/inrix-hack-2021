async function tradeAreaTrips(point, startDate, tripLength) {
    const axiosConfig = {
        "content-type": "application/json",
        Accept: "application/json",
        Authorization: await fetchToken(),
    };
    let od = "destination";
    let geoFilterType = "circle";
    let radius = "200ft";
    //point is given
    let limit = 100;
    let provider = "consumer";
    //start date is given
    let endDate = "<=2021-11-13T15:00";
    let endPointType = 3;
    //tripLength is given
    const tripsResponse = await axios
        .get("https://api.iq.inrix.com/v1/trips?od=" + od + "&geoFilterType=" + geoFilterType + "&points=" + point + "&limit=" + limit /
        +"&providerType=" + provider + "&startDateTime=" + startDate + "&endDateTime=" + endDate + "&endpointType=3", axiosConfig)
        .then((response) => {
        return response.data;
    })
        .catch((error) => {
        console.error("An error occured: ", error);
        throw "error";
    });
    return tripsResponse;
}
//# sourceMappingURL=tradeAreaTrips.js.map