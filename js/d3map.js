// DATA
var debug=0;
var threshold = -2.5;
//var thisPlaceName = "Dundee";
thisPlaceName = $("#place").text();

var thisPlaceX = [
  {
    name: "Bristol",
    latitude: 51.454513,
    longitude: -2.58791
  }
]
var placesDataFile = '/js/places.csv';


// BUILD THE MAP -- http://bost.ocks.org/mike/map/
// -------------
// create SVG object - half the example size
var width = 480,
    height = 580;
// now quater plus reduce scale below
var width = 240,
    height = 290;

// albers projection with this center & rotation is good for (whole of) UK 
var projection = d3.geo.albers()
    .center([0, 55.4])
    .rotate([4.4, 0])
    .parallels([50, 60])
    .scale(1500)
    .translate([width / 2, height / 2]);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);


// FETCH DATA (map & places)
// see http://bl.ocks.org/mapsam/6090056
queue()
  .defer(d3.json, '/js/uk.json')
  .defer(d3.csv, placesDataFile)
  .await(makeMyMap);


function makeMyMap(error, uk, allPlaces) {
  // loop through allPlaces & remove thisPlaceName to thisPlace (so can draw differently)
  var places = [];
  var thisPlace = [];
  for (index = 0; index < allPlaces.length; ++index) {
    //console.log(allPlaces[index]);    // DEBUG
    if (allPlaces[index]["name"] == thisPlaceName){
      if (debug) console.log ("matched name: " + allPlaces[index]["name"] + " = " + thisPlaceName);  // DEBUG
      thisPlace.push(allPlaces[index]);
    } else {
      places.push(allPlaces[index]);
    }
  }
  if (debug) console.log ("thisPlace: " + JSON.stringify(thisPlace)); // DEBUG

  //console.log ("thisPlace: " + JSON.stringify(thisPlace)); // DEBUG
  //console.log ("places: " + JSON.stringify(places)); // DEBUG

  // eng/wales/scot/ireland are all subunits - add to svg
  svg.selectAll(".subunit")
      .data(topojson.feature(uk, uk.objects.subunits).features)
    .enter().append("path")
      .attr("class", function(d) { return "subunit " + d.id; })
      .attr("d", path);

  // add internal boundaries (including ireland)
  svg.append("path")
    .datum(topojson.mesh(uk, uk.objects.subunits, function(a, b) { return a !== b ; }))
    .attr("d", path)
    .attr("class", "subunit-boundary");

  // add exterior boundry for ireland (if not filling country) 
  svg.append("path")
  .datum(topojson.mesh(uk, uk.objects.subunits, function(a, b) { return a === b && a.id === "IRL"; }))
  .attr("d", path)
  .attr("class", "subunit-boundary IRL");
 
  // country labels
  svg.selectAll(".subunit-label")
    .data(topojson.feature(uk, uk.objects.subunits).features)
  .enter().append("text")
    .attr("class", function(d) { return "subunit-label " + d.id; })
    .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
    .attr("dy", ".35em")
    .text(function(d) { return d.properties.name; });  


  // add (big) circle for thisPlace to svg
  /* NB convert lat long to projection  
        see http://stackoverflow.com/questions/20987535/plotting-points-on-a-map-with-d3 */
  svg.selectAll("circle")
  .data(thisPlace).enter()
  .append("circle")
  .attr("r", "8px")
  .attr("fill", "#404040")
  .attr("transform", function(d) {
      return "translate(" + projection([d.longitude,d.latitude]) + ")";
   });

  // add circles for each place (in places) to svg
  svg.selectAll("circle")
  .data(places).enter()
  .append("circle")
  .attr("r", "5px")
  .attr("fill", "#999")
  .attr("transform", function(d) {
      return "translate(" + projection([d.longitude,d.latitude]) + ")";
   });


  // add (big) lable for thisPlace to svg
  svg.selectAll(".primary-place")
  .data(thisPlace)
  .enter().append("text")
  .attr("class", "place-label")
  .attr("class", "primary-place")
  .attr("transform", function(d) {
      return "translate(" + projection([d.longitude,d.latitude]) + ")";
   })
  .attr("x", function(d) { return d.longitude > threshold ? 6 : -6; })
  .attr("dy", ".35em")
  .attr("dx", function(d) { return d.longitude > threshold ? "8px" : "-8px"; })
  .style("text-anchor", function(d) { return d.longitude > threshold ? "start" : "end"; })
  .text(function(d) { return d.name; });

  // add labels for each place (in places) to svg
  // use right-aligned labels on the left side of the map, and left-aligned labels on the right side of the map, here WAS using 1°W as the threshold - now using threshold set above (-2.5 works well for splitting Liverpool & Manchester)
  svg.selectAll(".place-label")
  .data(places)
  .enter().append("text")
  .attr("class", "place-label")
  .attr("transform", function(d) {
      return "translate(" + projection([d.longitude,d.latitude]) + ")";
   })
  .attr("x", function(d) { return d.longitude > threshold ? 6 : -6; })
  .attr("dy", ".35em")
  .attr("dx", function(d) { return d.longitude > threshold ? "5px" : "-5px"; })
  .style("text-anchor", function(d) { return d.longitude > threshold ? "start" : "end"; })
  .text(function(d) { return d.name; }); 


};