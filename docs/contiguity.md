# Contiguity

### **src/utils.js** 
Function `spatial_abilities` has `const status` which contains State info. One options is `contiguity` which is marked with a 2 (?) 

### **src/plugins/evaluation-plugin.js**

Within function `EvaluationPlugin(editor)`, If the plan is not a community and contiguity matters 

In the evaluation tab, add a Reveal Section named Contiguity. See `Charts/ContiguitySection` with
state and uiState based parameters.

src/lambda/planContiguity.js

### **src/plugins/tools-plugin.js**

`const c_checker` is generated in the `ToolsPlugin` function triggered when `spatial_abilities(state.place.id).contiguity` is true and communities mode is off. A `../map/ContiguityChecker` is created or c_checker is left null.

`c_checker` if is used, ContiguityChecker is passed parameters in the `brush.on("colorop,...)` function. 

### **src/components/Charts/ContiguitySection.js**

`ContiguitySection` takes the following parameters and returns html: `allParts, contiguityProblems, contigVersion, uiState,` and `dispatch`

First, it lists in `<h4>` what districts have contiguity gaps by filtering `contiguityProblems`. 

If `contigVersion` is 2 (from spatial_abilities), then the next display will be in block style rather than flex. 

 For each `AllParts`, a div is made either in flex or none display mode. A background of relevant color is set and the district name is displayed. A checkbox is finally offered with the text "Highlight islands."

 Where/how is this checkbox read?

### **src/map/contiguity.js**

This provides `function ContiguityChecker` which takes state and brush as parameters.

Variable `place` is extracted from the place.id and extra work is made if we're handling MA Towns, or Louisiana. 

If state doesn't have contiguity set, we assign it a null `{}`. 

Inside this function, `function updateIslandBorders` that acts on a checkbox's boolean state. For each boxed that's check, islandAreas is filled with each of the state's contiguities. 

A new variable `demo` is created, that contains `unitBordersPaintProperty, line-color, line-opacity` and  `line-width` essentially setting boundary properties. 

Another function `setContiguityStatus` issues a warning, sets myDistricts to display including its own checkbox. Finally calls `updateIslandBorders`.

`const updater` is a function that takes in `state` and `colorsAffected`. It is **here** that the server is called to calculate discontinuities, and it is this **updater** that is returned when `Contiguity Checker` is called.


## Other 

### src/components/Charts/HighlightUnassigned.js
Checks if a contiguity-label checkbox is selected.
----

## Description
assets/about/landing/rules.html
html/updates.html


## SASS

sass/components/_icon-list.scss

sass/app.scss


