const appName = "Aureos File Mapping Tool";
const appVersion = "v0.1.2 ALPHA";

let appPermissions
let userEmail

let mappingData
let contractList
let selectedProject

let statusData

let searchInput
let dropdown
let modal
let modalMessage

//// Home page variables

let cardData = [
    { title: "Request Project Mobilisation", description:"This is where you request an ACC project to be created", action: "requestProjectMobilisation.html" },
    { title: "View Requested Mobilisations", description:"This is where you can view already raised Mobilisations", action: "under_construction.html" },
    { title: "View All Requests", description:"To view all project Mobilisation requests", action: "under_construction.html" , display:"view_all_requests"},
    { title: "View Mobilisation Dashboard", description:"To view dashboard of ACC project uptake", action: "under_construction.html", display:"view_overview_dashboards" },
  ];

let userProjects = [
    { projectName: "Sky Tower", projectCode: "ST001", status: "In Progress" },
    { projectName: "River Bridge", projectCode: "RB402", status: "Completed" },
    { projectName: "City Park", projectCode: "CP882", status: "Pending" },
  ];
  