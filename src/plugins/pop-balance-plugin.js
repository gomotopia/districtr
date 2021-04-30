/****************
~~ src/plugins/pop-balance-plugin.js ~~
Created by @maxhully between Apr. and May. 2019.
Completed by @mapmeld between Jan. and Feb. 2021. 
VRA functionality by @jenni-niels and additional data
by @apizzimenti. 
Commentary on unassigned districts by @gomotopia, Apr. 2021.

Sub-state units usually don't have find_unpainted enabled. 

  Level 0: A new tab is created to be added to the editor Toolbar. This bar contains 
           the Population Balance section, which includes DatasetInfo, a bar chart, 
           and other information including the option to highlight unassigned districts.
           The ability to highlight unassigned districts is handled by
           src/components/Charts/HighlightUnassigned.js which requires the editor's state
           unit borders and a zoom function defined below.

  Level 1: The zoom function sends information to the UNASSIGNED server, collects and 
           verifies the response and turns it over to have the unassigned data processed.

  Level 2: The unassigned data takes the largest island of unassigned precincts and calls 
           the BOUNDS server to collect and verify coordinates to send to the editor. 

  Level 3: The Bounding Box for the editor map is set after digging through the BOUNDS
           server response. 

Unassigned server returns this kind of information... 

UNASSIGNED server output:
{-1: [["Moffat 008", "Moffat 004"], ["Arapahoe 402"], ["Garfield 024"]]}

BOUNDS server output: 
[[-108.787052169477, -108.614667446692, 40.3544520019652, 40.7647679172969]]

************/


import { html } from "lit-html";
import { Tab } from "../components/Tab";
import { spatial_abilities } from "../utils";
import HighlightUnassigned from "../components/Charts/HighlightUnassigned";
import MultiMemberPopBalanceChart from "../components/Charts/MMPopBalanceChart";
import populationBarChart from "../components/Charts/PopulationBarChart";
import populationDeviation from "../components/Charts/PopulationDeviation";
import unassignedPopulation from "../components/Charts/UnassignedPopulation";
import populateDatasetInfo from "../components/Charts/DatasetInfo";

export default function PopulationBalancePlugin(editor) {
    const problem = editor.state.plan.problem;
    const state = editor.state;

    // Settings if VRA enabled
    const showVRA = (problem.type !== "community") && (spatial_abilities(state.place.id).vra_effectiveness);

    let place = state.place.id,
        extra_source = (state.units.sourceId === "ma_precincts_02_10") ? "ma_02" : 0;
    if (state.units.sourceId === "ma_towns") {
        extra_source = "ma_towns";
    }
    if (state.units.sourceId === "indiana_precincts") {
        extra_source = "indianaprec";
    }
    const placeID = extra_source || place;
    const sep = (placeID === "louisiana") ? ";" : ",";

    const BOUNDS_URL = `//mggg.pythonanywhere.com/findBBox?place=${placeID}&`;
    // : `https://mggg-states.subzero.cloud/rest/rpc/bbox_${placeID}?`
    const UNASSIGNED_URL = "//mggg.pythonanywhere.com/unassigned";

  // ### Level 3 ##############################

    /*
      Sets editor.state.map bounds for zoom based on single
      bounding box. Does not touch editor.state.map unless
      the input bounding box has a length and a reference bounding
      box can be found with a length. 

      @param {JSON} bboxData Bounding box returned from server. 
      @return {null}
    */
    const setBBoxForMap = (bboxData) => 
    {
        if (bboxData.length)
        {
          referenceBbox = typeof bboxData[0] !== 'number' ? bboxData : bboxData[0]; 
          if (referenceBbox.length)
          {
              state.map.fitBounds([
                [referenceBbox[0], referenceBbox[2]],
                [referenceBbox[1], referenceBbox[3]]
              ]);
          }
        }
        return;
    }

  // ### Level 2 ##############################

    /*
      After JSON response deemed valid, precinct lists are sent here
      to be processed. The largest island is sent to the server to calculate
      its bounding box. 

      @param {JSON} Error-free data returned by Unassigned Server.
      @return {null}
    */
    const processUnassignedData = (unassignedPrecsResponse) => 
    {
      // Only if the data has multiple "-1" i.e. unassigned
      // precincts. 
      if (unassignedPrecsResponse["-1"] && unassignedPrecsResponse["-1"].length) 
      {
        // Sort the unassigned unit data by length and take the largest batch as list.
        const ids = unassignedPrecsResponse["-1"].filter(a => !a.includes(null)).sort((a, b) => b.length - a.length)[0];
        
        // Another server call that finds the bounding box for largest island of unassigned
        // units (trimmed to 100 places).

        fetch(`${BOUNDS_URL}ids=${ids.slice(0, 100).join(sep)}`)
          .then(res => res.json())
          .then(setBBoxForMap);
      }
    }

  // ### Level 1 ##############################
  /*
    Talks with the external server to calculate which precincts are
    unassigned. Function is passed to zoomToUnassigned button. 

    @param {error} e Error, if raised. 
    @return {null}
  */
  const zoomFunction = (e) =>
  {
      // Prepares plan to send to server, recieves response,
      // checks for errors and releases for processing. 
      let saveplan = state.serialize();
      fetch(UNASSIGNED_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saveplan),
      })
      .then((res) => res.json())
      .catch((e) => console.error(e))
      .then(processUnassignedData);
      return;
  }

  // ### Level 0 ##############################

  // VRA setting affects title. 
  const newPopBalanceTab = new Tab("criteria", showVRA ? "Pop." : "Population", editor.store);

  // Sets function depending on state-specific setting. 
  const zoomToUnassigned = spatial_abilities(state.place.id).find_unpainted ? 
                              zoomFunction:null; 

  // Creates PopBalance Section based whether problem type is
  // multimember or not.
  let barChart = "";
  let popDeviation = ""; 
  
  if (problem.type === "multimember")
  {
    barChart = MultiMemberPopBalanceChart(state.population, state.parts);
  }
  else {
    barChart = populationBarChart(state.population, state.activeParts);
    popDeviation = populationDeviation(state.population);}
  
  let popBalanceSectionHTML =  () => html`
    <section class="toolbar-inner dataset-info">
        ${populateDatasetInfo(state)};
    </section>
      ${barChart}
    <dl class="report-data-list">
        ${unassignedPopulation(state.population)}
        ${popDeviation}
        ${HighlightUnassigned(state.unitsBorders, zoomToUnassigned)}
    </dl>
    `
  // Adds reveal section to new Pop Balance Tab
  newPopBalanceTab.addRevealSection("Population Balance",popBalanceSectionHTML)
  // Adds new Pop Balance Tab to Editor Toolbar
  editor.toolbar.addTab(newPopBalanceTab);
  return;
}
