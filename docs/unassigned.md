# Unassigned Precincts

### **src/components/Charts/HighlightUnassigned.js**
Provides HTML for toggling global unassigned precinct highlighting
and button for smoothing.

### **src/plugins/pop-balance-plugin.js**
Primary user of HighlightUnassigned HTML and provides function `zoomToUnassigned`
among other functions.

## Other

### **src/map/contiguity.js**
Unselects unassigned highlighting when discontiguous highlighting is requested. 

### **src/colors.js**
Sets colors for unassigned district highlighting.

### **src/components/Charts/UnassignedPopulation.js**
Not related to highlighting, instead, reports size of unassigned population.

```export const highlightUnassignedUnitBordersPaintProperty```

## Descriptions

### **html/import-export.html**
("Unassigned units not include...")

### **html/guide.html**
("click the “Highlight unassigned units” box at the bottom...")