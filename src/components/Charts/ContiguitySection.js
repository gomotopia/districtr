/****************
~~ src/components/Charts/ContiguitySection.js ~~
Written by @mapmeld between March and October 2020. 
Commentary by @gomotopia, April 2021.

When the edit interface is rendered, it calls edit.js which calls, as a
default plugin, src/plugins/evaluation-plugin.js to render its Evaluation tab. 
ContiguitySection.js then returns a function that returns the relevant HTML.
This relies on state.contiguity whose data is collected in src/map/Contiguity.js.

tab.addRevealSection(
    "Contiguity",
    (uiState, dispatch) =>
        ContiguitySection(
            state.parts,
            state.contiguity,
            spatial_abilities(state.place.id).contiguity,
            uiState,
            dispatch
        ),
    {
        isOpen: true
    }
);

The ContiguitySection function creates a contiguity bar for each district, reads
which districts have discontiguities and chooses to display those in the following
manner.

  <section class="toolbar-section">
    <h4 id="contiguity-status">Gaps or no gaps</h4>
    <div id="contiguity-2"...>
      <span class="part-number"...> 3 </span>
      <label><input type="checkbox"/>Highlight islands</label>
    </div>
    <div id="contiguity-4"...>...</div>
        .
        .
        .
  </section>

************/

import { html } from "lit-html";
import { actions } from "../../reducers/charts";
import { districtColors } from "../../colors";

/*
Generates contiguity section html for front end. 
Called in /src/plugins/evaluation-plugin.js 

@param {} allparts
@param {} contiguityProblems Essentially state.contiguity generated from contiguity.js
@param {} contigVersion
@param {} uiState Not used!!!
@param {} dispatch Not used!!!
@return {html} Of entire section

*/
export default function ContiguitySection(allParts, contiguityProblems, contigVersion, uiState, dispatch) 
{
    // Indicate presence or absence of districts with contiguity issues,
    // which we filter for. 
    let discontigDistricts = Object.keys(contiguityProblems).filter(
        k => contiguityProblems[k] && contiguityProblems[k].length > 1)

    // This is also accessed and rewritten in src/Map/contiguity.js
    let discontigLabel = discontigDistricts.length > 0 ?
      html`Districts may have contiguity gaps (${discontigDistricts.map(n => (n * 1) + 1).join(", ")})`
      : "No contiguity gaps detected";

    let displayStyle = contigVersion === 2 ? "block" : "flex"

    // contiguity.js handles whether seen or unseen. 
    let discontigDistDivs = html`${
      allParts.map((part, dnum) =>
        {
          let displayPart = "none";
          let partColor = districtColors[dnum % districtColors.length].hex;

          // In lit-html, we must nest child nodes inside parent ones.
          let partSpan = html`<span class="part-number" style="background:${partColor}">
                              ${Number(dnum) + 1}
                              </span>`
          let partInput = contigVersion === 2 ? 
                        html`<label><input type="checkbox"/>Highlight islands</label>` : "";               

          let partDiv = html`<div id="contiguity-${dnum}"
                                  class="contiguity-label">
                                  ${partSpan}
                                  ${partInput}
                              </div>`

          return partDiv;
        })}`;

// Returns entire html section 
return html`<section class="toolbar-section"> 
              <h4 id="contiguity-status"> ${discontigLabel} </h4> 
              <div class="district-row" style="display:${displayStyle}"> 
                ${discontigDistDivs}
              </div> 
            </section>`;
}

