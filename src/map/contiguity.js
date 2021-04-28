/* eslint-disable linebreak-style */

/*
  ~~ Contiguity.js ~~
  Written by @mapmeld between March and December 2020 with contributions from Zhenghong Lieu.
  Commentary by Ryan Gomez, April 2021. Patterend off of NumberMarkers?

  In edit.js, a context is loaded, which requires a set of tool plugins, defined in tools-plugin.js.
  Within this function, a ContiguityChecker is called, described below.

  This function returns a CallContiguityChecker which sets in motion the querying and display
  of noncontiguous islands. 

  Level 0: returns CallContiguityChecker
  Level 1: CallContiguityChecker submits the state plan to the external Contiguity server
  Level 2: This response, once error checked, is parsed by ParseContigResponse which
           updates state.contiguity and an array that keeps track of non contiguous islands. 
  Level 3: SetContiguityStatus uses these tables to display options for the user to explore
           discontinuities. The user response listeners are initialized here.
  Level 4: Finally, UpdateIslandBorders is used to paint or unpaint highlighted borders around
           precincts.
*/


import { unitBordersPaintProperty } from "../colors";


export default function ContiguityChecker(state, brush) // brush not needed 
{
  // ### Initialize ###########################

  // Initializes state.contiguity as object if Null. 
  state.contiguity = state.contiguity ? state.contiguity : {};

  // ### Level 4 ##############################

  function UpdateIslandBorders()
  /*
    Colors in borders of islands based on checkboxes.

    @param {bool} checkboxFlipped If any checkboxes are flipped.
    @return {null} 
  */
  {
    let islandAreas = [];

    // Selects all inputs within a contiguity-label (districts) listed in district-row section 
    const boxes = document.querySelectorAll('.district-row .contiguity-label input');

    // If boxes are rendered for discontiguous units...
    if (boxes.length) {
      let noneChecked = false; 

      // iterates through boxes and checks if they're marked. 
      boxes.forEach((box, d) => {
        if (box.checked)
        // Adds each island area from selected area, or empty array. 
        // Ensures that noneChecked is false.  
        {
          islandAreas = islandAreas.concat(state.contiguity[d] || []);
          noneChecked = false;
        }})

      // If there are any boxes checked, set the right colors.  
      if (!noneChecked) {
        // References unitBordersPaintProperty in colors.js for use
        // with mapbox-gl
        let islandBorderProperties = 
        { "line-color": [
            "case",
            ["in", ["get", state.idColumn.key], ["literal", islandAreas]],
            "#f00000",
              unitBordersPaintProperty["line-color"]],
          "line-opacity": 0.4,
          "line-width": [
            "case",
            ["in", ["get", state.idColumn.key], ["literal", islandAreas]], 4, 1]};
        // See /src/map/Layer.js
        state.unitsBorders.setPaintProperties(islandBorderProperties);}
      else { 
        // No boxes checked, default borders restored. 
        state.unitsBorders.setPaintProperties(unitBordersPaintProperty);}
    }
    return;
  }

  // ### Level 3 ##############################

  /*
    Begins to display options for user to highlight discontinuities. 

    @param {Object} discontigDistricts, issues from ParseContigResponse. 
    @return {null} 
  */
  function SetContiguityStatus(discontigDistricts)
  {
    // Is there breaks? Website reports on number of discontig districts. 
    document.querySelector("#contiguity-status").innerText =
      discontigDistricts.length ? "Districts may have contiguity gaps"
                                : "No contiguity gaps detected";

    // districtContigSpans are spans that represent each district, with a checkbox 
    // toggling the highlighting of islands, and displayed only if there are
    // discontinuities. 
    let districtContigSpans = document.querySelectorAll('.district-row .contiguity-label');

    // Loop through all districts. Show if it it's in discontigDistricts
    // If the district is listed in discontiguousDistricts, include it, or don't display it. 
    for (let d = 0; d < districtContigSpans.length; d++) {
      districtContigSpans[d].style.display = discontigDistricts.includes(d) ? "flex" : "none";

      // If this district is indeed displayed, toggle off unassigned setting on any change!
      let box = districtContigSpans[d].querySelector('input');
      if (box ){
        districtContigSpans[d].querySelector('input').onchange = () =>
        {
          document.querySelector('#unassigned-checker input').checked = false;
          UpdateIslandBorders();
        };}}

    UpdateIslandBorders();
    return;
  }

   // ### Level 2 ##############################

  function ParseContigResponse(contig_data)
  /*
    Parses error-checked information from server. Contiguity data is nested
    arrays of 

    District: [
      Island:[Precinct, Precicnt...]
      Island:[Precinct, Precicnt...]
      Island:... 
    ]
    District... 

    Two datastructures are updated, state.contiguity, an object that pairs
    district number and island districts and discontigDistricts, a list of districts
    where contiguities were found. 

    @param {Object} contig_data Error-checked island data for each district.
    @return {null} 
  */
  {
    state.contiguity = {};
    let discontigDistricts = [];
    /* 
      For each District's list of islands, if there are 2 or more islands, then 
      the District's number is recorded in discontigDistricts.  
    */

    let reportedDistricts = Object.keys(contig_data);

    reportedDistricts.forEach(
      (reportedDistrict) => {

        let reportedDistrictIndex = Number(reportedDistrict);
        let reportedDistrictIslands = contig_data[reportedDistrict]; 

        if (reportedDistrictIslands.length > 1) {
          // Add to list of discontiguousDistricts. 
          discontigDistricts.push(reportedDistrictIndex);

          // Fill island areas by ranking the length of each island
          // removing the largest one and combine the rest of the precincts
          // into one array. 

          let islandareas = [];
          reportedDistrictIslands.sort((a, b) => { return b.length - a.length })
            .slice(1)
            .forEach(island => { islandareas = islandareas.concat(island);})

          // The IslandAreas are registered in state.contiguity.
          state.contiguity[reportedDistrictIndex] = islandareas;}       
        else {
         state.contiguity[reportedDistrictIndex] = null; }
    }) //;
    SetContiguityStatus(discontigDistricts);
    return;
  }

  // ### Level 1 ##############################

  const CallContiguityServer = (state_plan) => {
  /*
    Sends, recieves and processes information to and from the server. 

    @param {State} state_plan Current State plan.
    @return {null} 
  */

    // Prepare plan for sending. npm function. 
    let saveplan = state_plan.serialize();

    // URL for outside server
    const CONTIG_SERVER = "//mggg.pythonanywhere.com/contigv2";

    fetch(CONTIG_SERVER + "", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(saveplan),
    })
      .then((res) => res.json())
      .catch((e) => console.error(e))
      .then(ParseContigResponse);
    return; } 

  // ### Level 0 ##############################
  CallContiguityServer(state);
  return CallContiguityServer;
}



