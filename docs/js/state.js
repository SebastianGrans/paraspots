// Shared mutable state. Importers mutate properties on this object directly
// (reassigning the imported binding itself isn't allowed by ES modules, but
// mutating its properties is) rather than threading state through params.
export const state = {
    allTakeoffs: [],
    selectedTakeoff: null,
    referenceLocation: null,
    listItems: new Map(), // takeoff -> <li>
    takeoffMarkers: new Map(), // takeoff -> L.marker
};
