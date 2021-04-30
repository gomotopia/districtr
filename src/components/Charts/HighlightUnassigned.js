/****************
~~ src/components/Charts/HighlightUnassigned.js ~~
Created by @maxhully between Feb. and Apr. 2019.
Completed by @mapmeld between Oct. '20 and Jan. '21. 
Commentary by @gomotopia, Apr. 2021.

Highlighting unassigned districts is a global toggle that colors
the boundaries of unassigned districts. Later on, the ability to zoom
into unassigned districts was created. 

Uses src/components/toggle.js which creates and returns an
html checkbox input with an id, default value and listener
within a label of class toolbar-checkbox.

This html is included in src/plugins/pop-balance-plugin.js

************/


import {
    highlightUnassignedUnitBordersPaintProperty,
    unitBordersPaintProperty
} from "../../colors";
import { html } from "lit-html";
import toggle from "../Toggle";


/*
Generates html allowing user to toggle the highlight of unassigned districts
and the ability to zoom into those districts.

@param {} unitsBorders Discontiguous distrcits determined in pop-balance-plugin.js
@param {} zoomFunction Function from pop-balanace-plugin that zooms map to unhighlighted area. 
@return {html} HTML that includes toggle and zoom buttons. 

*/
export default function HighlightUnassigned(unitsBorders, zoomFunction)
{

    /*
    Callback function for checkbox listener. First, removes discontiguous
    highlighting, then determines highlighting and zoom button display
    based off of a highlight paramater. 

    @param {boolean} highlight The choice to highlight unassigned or not
    @return {null}

    */
    let toggleHighlight = (highlight) => {

        // Removes all discontiguous highlighting by unchecking boxes
        document.querySelectorAll('.district-row .contiguity-label input').forEach
            (box => {box.checked = false;});

        // Defines default color properties for unhighlighted districts and
        // changes features if highlight is selected. 
        let highlightSetting = unitBordersPaintProperty;
        let zoomDisplaySetting = "none";

        if (highlight){
            highlightSetting = highlightUnassignedUnitBordersPaintProperty;
            zoomDisplaySetting = "block"}

        unitsBorders.setPaintProperties(highlightSetting);
        document.querySelector("#zoom-to-unassigned").style.display = zoomDisplaySetting;
        return; 
    };

    let toggleLabel = html`${toggle("Highlight unassigned units", false, toggleHighlight)}`

    let zoomButton = html`<button @click="${zoomFunction}">Zoom to unasssigned</button>`

    let zoomDiv = html`<div id="zoom-to-unassigned" style="display:none">
                            ${zoomFunction ? zoomButton : ''}
                       </div>`

    return html`<div id="unassigned-checker" class="ui-option ui-option--slim">
                    ${toggleLabel}
                    ${zoomDiv}
                </div>`;
}
