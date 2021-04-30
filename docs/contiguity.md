# Contiguity

Contiguity drop-down maybe sticky. Reverts to 'Districts may have discontinuity' rather than displaying rows of checkboxes.

### **src/utils.js** 
Function `spatial_abilities` has `const status` which contains State info. One options is `contiguity` which is marked with a 2 (?) 

Even states not listed with the `contiguity` option has a highlight islands feature.

### **src/plugins/evaluation-plugin.js**

Within function `EvaluationPlugin(editor)`, If the plan is not a community and contiguity matters 

In the evaluation tab, add a Reveal Section named Contiguity. See `Charts/ContiguitySection` with
state and uiState based parameters.

src/lambda/planContiguity.js

### **src/plugins/tools-plugin.js**

`const c_checker` is generated in the `ToolsPlugin` function triggered when `spatial_abilities(state.place.id).contiguity` is true and communities mode is off. A `../map/ContiguityChecker` is created or c_checker is left null.

`c_checker` if is used, ContiguityChecker is passed parameters in the `brush.on("colorop,...)` function. 

### **src/components/Charts/ContiguitySection.js**

```
When the edit interface is rendered, it calls edit.js which calls, as a
default plugin, src/plugins/evaluation-plugin.js to render its Evaluation tab. 
ContiguitySection.js then returns a function that returns the relevant HTML.
This relies on state.contiguity whose data is collected in src/map/Contiguity.js...

ContiguitySection function creates a contiguity bar for each district, reads
which districts have discontiguities and chooses to display those in the following
manner.
```
~~ src/components/Charts/ContiguitySection.js ~~

`ContiguitySection` takes the following parameters and returns html: `allParts, contiguityProblems, contigVersion, uiState,` and `dispatch`

First, it lists in `<h4>` what districts have contiguity gaps by filtering `contiguityProblems`. 

If `contigVersion` is 2 (from spatial_abilities), then the next display will be in block style rather than flex. 

 For each `AllParts`, a div is made either in flex or none display mode. A background of relevant color is set and the district name is displayed. A checkbox is finally offered with the text "Highlight islands."

 Where/how is this checkbox read?


### **src/map/contiguity.js**

```
  ~~ Contiguity.js ~~
  Written by @mapmeld between March and December 2020 with contributions from Zhenghong Lieu.
  Commentary by @gomotopia, April 2021. Patterend off of NumberMarkers?

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
```

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
assets/about/alaska/research.html

## SASS

sass/components/_icon-list.scss

sass/app.scss


