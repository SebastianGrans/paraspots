// Shared mutable state. Importers mutate properties on this object directly
// (reassigning the imported binding itself isn't allowed by ES modules, but
// mutating its properties is) rather than threading state through params.
export const state = {
    // List of all takeoffs populated from data/takeoffs.json
    allTakeoffs: [],
    selectedTakeoff: null,
    // Either a location set by the user, or found by geolocation
    referenceLocation: null,
    listItems: new Map(), // takeoff -> <li>
    takeoffMarkers: new Map(), // takeoff -> L.marker
};
