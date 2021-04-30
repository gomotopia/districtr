/****************
~~ src/plugins/pop-balance-plugin.js ~~
Created by @maxhully between Apr. and May. 2019.
Completed by @mapmeld between Jan. and Feb. 2021. 
VRA functionality by @jenni-niels and additional data
by @apizzimenti. 

Single function PopulationBalancePlugin. Contains zoomToUnassigned 
function. 

Relies on find_unpainted state utils setting. Necessary?

Commentary on unassigned districts by @gomotopia, Apr. 2021.

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
    const showVRA = (state.plan.problem.type !== "community") && (spatial_abilities(state.place.id).vra_effectiveness);
    const tab = new Tab("criteria", showVRA ? "Pop." : "Population", editor.store);

    let place = editor.state.place.id,
        extra_source = (editor.state.units.sourceId === "ma_precincts_02_10") ? "ma_02" : 0;
    if (editor.state.units.sourceId === "ma_towns") {
        extra_source = "ma_towns";
    }
    if (editor.state.units.sourceId === "indiana_precincts") {
        extra_source = "indianaprec";
    }
    const placeID = extra_source || place;
    const sep = (placeID === "louisiana") ? ";" : ",";



    /*
      Talks with the external server to calculate unassigned boundaries and process
      information.

      @param {JSON} Error-free data returned by Unassigned Server.
      @return {null}
    */
    const processUnassignedData = (data) => 
    {
      // Only if the data has multiple "-1" i.e. unassigned
      // precincts. 
      if (data["-1"] && data["-1"].length) 
      {
        // Sort the unassigned unit data by length and take the largest batch as list.
        const ids = data["-1"].filter(a => !a.includes(null)).sort((a, b) => b.length - a.length)[0];
        
        //Another server call that finds the bounding box for list of places given State info.  
        const myurl = `//mggg.pythonanywhere.com/findBBox?place=${placeID}&`;
          // : `https://mggg-states.subzero.cloud/rest/rpc/bbox_${placeID}?`

        fetch(`${myurl}ids=${ids.slice(0, 100).join(sep)}`)
          .then(res => res.json())
          .then((bbox) => {

          // Checks if bbox has a length and the first entry is a
          // number
          if (bbox.length && typeof bbox[0] === 'number')
            { 
              bbox = {x: bbox};
            }
          // If the first entry isn't a number, move to the first element
          // and try again. 
          else if (bbox.length)
            {
              bbox = bbox[0]; // 
              if (bbox.length)
              {
                bbox = {x: bbox};
              }
          }
          // Null if no length. 

          // assign bbox values to editor.state.map.fitBounds,
          // which changes the zoom of the box.
          Object.values(bbox).forEach(mybbox => {
            editor.state.map.fitBounds([
              [mybbox[0], mybbox[2]],
              [mybbox[1], mybbox[3]]
            ]);
          });
        });

      }
    }
      
    /*
      Talks with the external server to calculate unassigned boundaries and process
      information.

      @param {error} e Error, if raised. 
      @return {null}
    */
    const zoomFunction = (e) =>
    {
        // Prepares plan to send to server, recieves response,
        // checks for errors and releases for processing. 
        let saveplan = state.serialize();
        const UNASSIGNED_URL = "//mggg.pythonanywhere.com/unassigned";
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

    // Sets function depending on state-specific setting. 
    const zoomToUnassigned = spatial_abilities(editor.state.place.id).find_unpainted ? 
                                zoomFunction:null; 

    if (problem.type === "multimember") {
        tab.addRevealSection(
            "Population Balance",
            () => html`
                <section class="toolbar-inner dataset-info">
                    ${populateDatasetInfo(state)};
                </section>
                ${MultiMemberPopBalanceChart(state.population, state.parts)}
                <dl class="report-data-list">
                    ${unassignedPopulation(state.population)}
                    ${HighlightUnassigned(state.unitsBorders, zoomToUnassigned)}
                </dl>
            `
        );
    } else {
        tab.addRevealSection(
            "Population Balance",
            () =>
                html`
                    <section class="toolbar-inner dataset-info">
                        ${populateDatasetInfo(state)};
                    </section>
                    ${populationBarChart(state.population, state.activeParts)}
                    <dl class="report-data-list">
                        ${unassignedPopulation(state.population)}
                        ${populationDeviation(state.population)}
                        ${HighlightUnassigned(state.unitsBorders, zoomToUnassigned)}
                    </dl>
                `
        );
    }
    
    // Add the tab to the toolbar.
    editor.toolbar.addTab(tab);
}
