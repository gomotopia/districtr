/* eslint-disable linebreak-style */

// This makes a POST request to a PythonAnywhere server
// with the assignment in the request body.
// The server will return a response with the
// 1. contiguity status and
// 2. number of cut edges
// and this function then calls two other functions (defined above)
// that modify the innerHTML of the file

/*

  state.place.id
  state.units.sourceId
  state.contiguity
  state.idColumn.key

*/ 


import { unitBordersPaintProperty } from "../colors";

export default function ContiguityChecker(state, brush)
{
  let placeID = state.place.id,
  
  // Checks if Mass data is used. 

  if (state.units.sourceId === "ma_precincts_02_10")
    place = "ma_02";
  else if (state.units.sourceId === "ma_towns")
    place = "ma_towns";

  // Checks if Louisiana separator needed. 
  const sep = (state.place.id === "louisiana") ? ";" : ",";

  // Ensures that state.contiguity is not null
  state.contiguity = state.contiguity ? state.contiguity : {};

  function updateIslandBorders(checkboxFlipped)
  /*
    Colors in borders of islands based on checkboxes.

    @param {bool} checkboxFlipped If any checkboxes are flipped.
    @return {null} 
  */
  {
    let islandAreas = [];

    // Selects all inputs within a contiguity-label (districts) listed in district-row section 
    const boxes = document.querySelectorAll('.district-row .contiguity-label input');

    // if discontinuities are found (if there are any boxes)...
    if (boxes.length)
    {
      let noneChecked = !checkboxFlipped; 

      /***
        If noneChecked is False, each box is checked and if there
        are boxes that are checked, then noneChecked remains false.
        
        If noneChecked is True, each box is still checked and if
        there are boxes that are checked, noneChecked is corrected.
      ***/
    
      boxes.forEach((box, d) => 
      {
        if (box.checked)
        // Adds each island area from selected area, or empty array. 
        // Ensures that noneChecked is false.  
        {
          islandAreas = islandAreas.concat(state.contiguity[d] || []);
          noneChecked = false;
        }
      });

      // if there are any boxes checked... 
      if (!noneChecked)
      {
        // References unitBordersPaintProperty in colors.js
        let islandBorderProperties = 
        {
            "line-color": [
                "case",
                ["in", ["get", state.idColumn.key], ["literal", islandAreas]],
                "#f00000",
                unitBordersPaintProperty["line-color"]
            ],
            "line-opacity": 0.4,
            "line-width": ["case", ["in", ["get", state.idColumn.key], ["literal", islandAreas]], 4, 1],
        };

        // See /src/map/Layer.js
        state.unitsBorders.setPaintProperties(islandBorderProperties);
      }
    }
    return;
  }

////////////////////////////////////////////
  /*
    ...

    @param {Object} contiguity_breaks, issues from udpater. 
    @return {null} 
  */
  function setContiguityStatus(contiguity_breaks)
  {
    // Is there breaks? Update the website. 
    document.querySelector("#contiguity-status").innerText =
        contiguity_breaks.length
            ? "Districts may have contiguity gaps"
            : "No contiguity gaps detected";

      // myDistricts are spans that represent each district, with a checkbox 
      // toggling the highlighting of islands, and displayed only if there are
      // discontinuities. 
    let myDistricts = document.querySelectorAll('.district-row .contiguity-label');

    for (let d = 0; d < myDistricts.length; d++)
    {
      // show-hide label altogether
      // If the district is listed in issues, include it, or don't display it. 
      myDistricts[d].style.display = contiguity_breaks.includes(d) ? "flex" : "none";

      // If this district is indeed displayed, toggle off unassigned setting!
      let box = myDistricts[d].querySelector('input');
      if (box) {
        myDistricts[d].querySelector('input').onchange = () => {
          document.querySelector('#unassigned-checker input').checked = false;
          updateIslandBorders(true);
        };
      }
    }

    updateIslandBorders();
  }

//////////////////////////


  const updater = (state, colorsAffected) => {
  /*
    Sends, recieves and processes information to and from the server. 

    @param {State} Current State plan.
    @param {Array} Array of numbers of size numberOfParts, "allDistricts?". Not used!
    @return {null} 
  */

    // Prepare plan for sending. npm function. 
    let saveplan = state.serialize();

    // URL for outside server
    const GERRYCHAIN_URL = "//mggg.pythonanywhere.com";

    /**
     We're fetching from the PythonAnywhere server. 
     We send to fetch the URL and options, "headers," "body"
     of POST request. 
     
     The server's Contiguity app returns an object of arrays
     that enumerate each district, with nested arrays that outline
     each districts's islands as an array of
     Precinct ID strings. 

     The response res is then converted into a JSON,
     any errors are caught, then...
     */
    fetch(GERRYCHAIN_URL + "/contigv2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(saveplan),
    })
      .then((res) => res.json())
      .catch((e) => console.error(e))
      /*
      A function here is called to parse out the data. 

      A blank state.contiguity Object and a blank issues Array
      are created. 
      */
      .then((data) => {
        state.contiguity = {};
        let issues = [];
        /* 
          For each District's list of islands, 
          if there are 2 or more islands, then 
          the District's number is recorded in 
          issues.  
        */


        Object.keys(data).forEach(
          
          (district) => {
          if (data[district].length > 1) {
            // basic contiguity
            issues.push(Number(district));

            // Fill island areas by ranking the length of each island
            // removing the largest one and combine the rest of the precincts
            // into one array. 

            let islandareas = [];
            data[district].sort((a, b) => { return b.length - a.length })
              .slice(1)
              .forEach(island => { islandareas = islandareas.concat(island);})

            // The IslandAreas are registered in state.contiguity.
            state.contiguity[Number(district)] = islandareas;
          } 
          
          // If there are 1 or 0 islands, then the district is registered
          // in state.contiguity as null. 
          
          else {
            state.contiguity[Number(district)] = null;
          }
        });
        setContiguityStatus(issues);
      });
  };

  // Generate array with number of each part. 
  /*
  let allDistricts = [],
    i = 0;
  while (i < state.problem.numberOfParts) {
    allDistricts.push(i);
    i++;
  }
  */ 

  let allDistricts = [...Array(state.problem.numberOfParts).keys()]


  updater(state, allDistricts);
  return updater;
}
