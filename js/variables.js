const appName = "Aureos ACC Mapping Tool";
const appVersion = "v1.0.0";

let appPermissions
let userEmail

let mappingData
let roleData
let nsData
let contractList
let selectedProject

let statusData

let searchInput
let dropdown
let modal
let modalMessage

let addType = 'files'; 

let nsArray = [
    "projectPin",
    "originator",
    "function",
    "spatial",
    "form",
    "discipline"
]