document.addEventListener("DOMContentLoaded", async function () {
    document.getElementById("appInfo").textContent = `${appName} ${appVersion}`;
    const galleryContainer = document.getElementById('galleryContainer')
    const gallery = document.getElementById('projectGallery');
    const searchInput = document.getElementById('searchInput');
    const searchInputNS = document.getElementById('searchInputNS');
    //const statusFilter = document.getElementById('statusFilter');

    let tab = window.location.hash.substring(1); // Remove the '#'
    if (!tab) tab = "files"; // Default tab
    toggleTab(`${tab}Container`, tab)

    await showLoadingSpinner(galleryContainer)
    mappingData = await getMappingData()
    roleData = await getRoleData()
    nsData = await getNSData()
    const tree = buildTree(mappingData.folders);
    await buildRoleGrid(roleData)
    document.getElementById("folderTree").appendChild(renderTree(tree));
    await populateNSTables(nsData)
    await hideLoadingSpinner(galleryContainer)

    function renderGallery(filteredProjects) {
      gallery.innerHTML = "";
      if (filteredProjects.length === 0) {
        gallery.innerHTML = "<p>No matching projects found.</p>";
        return;
      }
      filteredProjects.forEach(item => {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.innerHTML = `
            <h3>${item['File Type']}</h3>
            <p><strong>Folder:</strong> ${item['ACC Folder Path']}</p>
            <p><strong>Form:</strong> ${item['Form']}</p>
           `;
        gallery.appendChild(card);
      });
    }

    function filterProjects() {
      const searchTerm = searchInput.value.toLowerCase();
    //   const statusValue = statusFilter.value;

      const filtered = mappingData.files.filter(p => {
        const matchesSearch = p['File Type'].toLowerCase().includes(searchTerm) || 
                              p['ACC Folder Path'].toLowerCase().includes(searchTerm);
        // const matchesStatus = statusValue === "" || p.status === statusValue;
        return matchesSearch 
      });

      renderGallery(filtered);
    }
    function filterNS() {
      let filtered = []
      let sectionData = []
      const searchTerm = searchInputNS.value.toLowerCase();
    //   const statusValue = statusFilter.value;
      nsArray.forEach(element => {
        const section = nsData.default[element]
        // console.log(section)
        const result = section.filter(p => {
          const matchesSearch = p['Value'].toLowerCase().includes(searchTerm) || 
                                p['Description'].toLowerCase().includes(searchTerm);
          return matchesSearch 
        })
        // const componentArray = table_array.default[element]
          let nsGridElement = document.getElementById(`nsGrid-${element}`)
          let tableBody = document.querySelector(`#ns_${element}_table tbody`)
          tableBody.innerHTML = ''
          result.forEach(item => {
            const mainRow = document.createElement("tr");
            mainRow.innerHTML = `
              <td>${item.Value}</td>
              <td>${item.Description}</td>
            `
            tableBody.appendChild(mainRow);
        });
        if(result.length === 0){
          nsGridElement.style.display = 'none'
        }else{
          nsGridElement.style.display = 'block'
        }

        // console.log(result)
        // if(result.length !== 0){
        //   obj = {[element]:result}
        //   console.log(obj)
        //   sectionData.push({[element]:result})
        // }
        
      });
      // const reformat = Object.assign({}, ...sectionData);
      // filtered = {default:reformat}
      // console.log(filtered)
      // populateNSTables(filtered);
    }

    // Event listeners
    searchInput.addEventListener('input', filterProjects);
    searchInputNS.addEventListener('input', filterNS);
    //statusFilter.addEventListener('change', filterProjects);

    // Initial render
    renderGallery(mappingData.files);
    const modal = document.getElementById("myModal");
    const spanClose = document.querySelector(".close");
    const modalTitle = document.getElementById("modalTitle");
    const editPerm = document.getElementById("editPerm");
    const viewPerm = document.getElementById("viewPerm");

    spanClose.onclick = () => modal.style.display = "none";
    window.onclick = (event) => { if (event.target === modal) modal.style.display = "none"; };

    function buildTree(data) {
      const root = {};
      data.forEach(({ concat_path, permissions_edit, permissions_view }) => {
        const parts = concat_path.split(" / ");
        let current = root;
        parts.forEach((part, index) => {
          if (!current[part]) current[part] = { _children: {}, _info: {} };
          if (index === parts.length - 1) {
            current[part]._info = { concat_path, permissions_edit, permissions_view };
          }
          current = current[part]._children;
        });
      });
      return root;
    }

    function getEffectivePermissions(pathParts, tree) {
      let current = tree;
      let effective = { edit: "", view: "" };
      for (const part of pathParts) {
        if (!current[part]) break;
        const info = current[part]._info;
        if (info.permissions_edit) effective.edit = info.permissions_edit;
        if (info.permissions_view) effective.view = info.permissions_view;
        current = current[part]._children;
      }
      return {
        edit: effective.edit || "None",
        view: effective.view || "None"
      };
    }

    function renderTree(tree, parentPath = "", parentParts = []) {
      const ul = document.createElement("ul");

      for (const key in tree) {
        const li = document.createElement("li");
        const label = document.createElement("div");
        label.classList.add("folder-label");

        const icon = document.createElement("span");
        icon.classList.add("folder-icon");
        icon.textContent = "\ud83d\udcc1";

        const name = document.createElement("span");
        name.textContent = key;

        const currentPath = parentPath ? `${parentPath} / ${key}` : key;
        const currentParts = [...parentParts, key];
        const folderInfo = tree[key]._info;
        const hasChildren = Object.keys(tree[key]._children).length > 0;

        label.onclick = function () {
          modal.style.display = "block";
          modalTitle.textContent = currentPath;

          const effective = getEffectivePermissions(currentParts, buildTree(mappingData.folders));

          editPerm.textContent = folderInfo.permissions_edit || (effective.edit !== "None" ? "Inherited: " + effective.edit : "None");
          viewPerm.textContent = folderInfo.permissions_view || (effective.view !== "None" ? "Inherited: " + effective.view : "None");

          const children = this.parentNode.querySelector("ul");
          if (children) {
            children.classList.toggle("active");
            if (caret) caret.classList.toggle("caret-down");
          }
        };

        let caret = null;
        if (hasChildren) {
          caret = document.createElement("span");
          caret.classList.add("caret");
          label.appendChild(caret);
        } else {
          const emptySpace = document.createElement("span");
          emptySpace.style.display = "inline-block";
          emptySpace.style.width = "12px";
          label.appendChild(emptySpace);
        }

        label.appendChild(icon);
        label.appendChild(name);
        li.appendChild(label);

        if (hasChildren) {
          li.appendChild(renderTree(tree[key]._children, currentPath, currentParts));
        }

        ul.appendChild(li);
      }

      return ul;
    }

//////////////////////////////// Add Modal



  const addModal = document.getElementById("addModal");
  const openBtn = document.getElementById("openAddModalBtn");
  const closeBtn = document.getElementById("closeModalBtn");
  const addModalTitle = document.getElementById("addModalTitle");
  // const formLabel = document.getElementById("titleFormLabel");
  const addForm = document.getElementById('dynamicForm')

  // Open modal on button click
  openBtn.onclick = function() {
    addModal.style.display = "block";
    addForm.innerHTML = ''
    // Update the form dynamically based on addType
    if (addType === 'files') {
      addModalTitle.textContent = "Add Missing File Request";
    // Text Input
      const fileNameLabel = document.createElement('label')
      fileNameLabel.textContent = "Enter file request name:"
      const fileNameInput = document.createElement('input')
      fileNameInput.id = 'fileNameInput'
      fileNameInput.required = true

      // Folder Dropdown
      const folderDropdownLabel = document.createElement('label')
      folderDropdownLabel.textContent = 'Please select where you believe the file should live in the folder structure'
      const folderDropdown = document.createElement('select')
      folderDropdown.id = 'fileFolderDropdown'
      folderDropdown.required = true
      mappingData.folders.forEach(element => {
        const option = document.createElement('option')
        option.value = element.concat_path
        option.textContent = element.concat_path
        folderDropdown.appendChild(option)
      });
      addForm.appendChild(fileNameLabel)
      addForm.appendChild(fileNameInput)
      addForm.appendChild(folderDropdownLabel)
      addForm.appendChild(folderDropdown)
      

    } else if (addType === 'folders') {
      addModalTitle.textContent = "Add Folder Request";
      // Text Input
      const folderNameLabel = document.createElement('label')
      folderNameLabel.textContent = "Enter folder request name:"
      const folderNameInput = document.createElement('input')
      folderNameInput.id = 'folderNameInput'
      folderNameInput.required = true


      // Folder Dropdown
      const folderDropdownLabel = document.createElement('label')
      folderDropdownLabel.textContent = 'Please select which folder your requested folder should sit in'
      const folderParentFolderDropdown = document.createElement('select')
      folderParentFolderDropdown.id = 'folderParentFolderDropdown'
      folderParentFolderDropdown.required = true
      const filtered = mappingData.folders.filter(item => {
        const slashCount = (item.concat_path.match(/\//g) || []).length;

        if (item.concat_path.includes("Z.PROJECT_ADMIN")) {
          // Only include if exactly 1 slash
          return slashCount === 1;
        } else {
          // Allow 0 or 1 slashes
          return slashCount < 1;
        }
      });
      filtered.forEach(element => {
        const option = document.createElement('option')
        option.value = element.concat_path
        option.textContent = element.concat_path
        folderParentFolderDropdown.appendChild(option)
      });

      addForm.appendChild(folderNameLabel)
      addForm.appendChild(folderNameInput)
      addForm.appendChild(folderDropdownLabel)
      addForm.appendChild(folderParentFolderDropdown)
    } else if (addType === 'roles') {
      addModalTitle.textContent = "Add Role Request";
      // Text Input
      const roleNameLabel = document.createElement('label')
      roleNameLabel.textContent = "Enter role name:"
      const roleNameInput = document.createElement('input')
      roleNameInput.id = 'roleNameInput'
      roleNameInput.required = true

      // Folder Dropdown
      const folderDropdownLabel = document.createElement('label')
      folderDropdownLabel.textContent = 'Please select which folder this role would require access to (hold ctrl to select multiple)'
      const folderParentFolderDropdown = document.createElement('select')
      folderParentFolderDropdown.id = 'selectFolderDropdown'
      folderParentFolderDropdown.required = true
      folderParentFolderDropdown.multiple = true
      const filtered = mappingData.folders.filter(item => {
        const slashCount = (item.concat_path.match(/\//g) || []).length;

        if (item.concat_path.includes("Z.PROJECT_ADMIN")) {
          // Only include if exactly 1 slash
          return slashCount === 1;
        } else {
          // Allow 0 or 1 slashes
          return slashCount < 1;
        }
      });
      filtered.forEach(element => {
        const option = document.createElement('option')
        option.value = element.concat_path
        option.textContent = element.concat_path
        folderParentFolderDropdown.appendChild(option)
      });

      addForm.appendChild(roleNameLabel)
      addForm.appendChild(roleNameInput)
      addForm.appendChild(folderDropdownLabel)
      addForm.appendChild(folderParentFolderDropdown)
    } else {

    }

    const emailInput = document.createElement('input')
    emailInput.id = 'emailInput'
    emailInput.type = 'email'
    emailInput.required = true
    emailInput.placeholder = 'Please enter your email so we can contact you'
    addForm.appendChild(emailInput)

    const submitButton = document.createElement('button')
    submitButton.textContent = `Submit ${addType} request`
    submitButton.type = 'submit'
    addForm.appendChild(submitButton)

    // Example form submit handler
    document.getElementById("dynamicForm").addEventListener("submit", function(e) {
    e.preventDefault();
    let formData
      switch (addType) {
        case 'files':
          formData = {
            requestType:addType,
            requestAdditionName: document.getElementById('fileNameInput').value,
            folderLocation: document.getElementById('fileFolderDropdown').value,
            emailInput:document.getElementById('emailInput').value,
          }
          break;
        case 'folders':
          formData = {
            requestType:addType,
            requestAdditionName: document.getElementById('folderNameInput').value,
            folderLocation: document.getElementById('folderParentFolderDropdown').value,
            emailInput:document.getElementById('emailInput').value,
          }
          break;
        case 'roles':

          const select = document.getElementById('selectFolderDropdown');

          const selectedValues = Array.from(select.selectedOptions).map(option => option.value);
          formData = {
            requestType:addType,
            requestAdditionName: document.getElementById('roleNameInput').value,
            folderLocation: selectedValues.join(", "),
            emailInput:document.getElementById('emailInput').value,
          }
          break;
      
        default:
          break;
      }
    // Send data to your HTTP endpoint (replace URL with your actual endpoint)
  fetch('https://prod-15.uksouth.logic.azure.com:443/workflows/b1e709a54b0e43a58f50cfec58540e08/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=5mOG3atbFl1mFkX4G69GhJ-C1lHVK5YLENVq_0HXOOg', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  })
  .then(response => {
    if (response.ok) {
      showPopup('Addidion Request Submitted', 'Your request has been successfully submitted to the ACC Support Team',true)
    } else{
      showPopup('Addidion Request Failed', 'An error occured with your request please contact ACCSupportDigital@aureos.com',false)
    }
    return
  })
  .catch(error => {
    console.error('Error:', error);
    alert('There was an error submitting the form.');
  });

    addModal.style.display = "none";
  });
  };

  // Close modal on X click
  closeBtn.onclick = function() {
    addModal.style.display = "none";
  };

  // Close modal if clicking outside the content
  window.onclick = function(event) {
    if (event.target == addModal) {
      addModal.style.display = "none";
    }
  };



})

function toggleTab(containerId,type) {
  const allTabs = document.querySelectorAll('.tab-content');
  const buttons = document.querySelectorAll('.tab-button');

  allTabs.forEach(tab => {
    tab.classList.remove('active');
  });

  buttons.forEach(btn => {
    btn.classList.remove('active');
  });
  addType = type
  document.getElementById(containerId).classList.add('active');
  document.getElementById(type).classList.add('active');
}

async function generateGallery(projects) {
    const gallery = document.getElementById('projectGallery');

    projects.forEach(project => {
      const card = document.createElement('div');
      card.className = 'gallery-card';

      card.innerHTML = `
        <h3>${project.projectName}</h3>
        <p><strong>Code:</strong> ${project.projectCode}</p>
        <p class="gallery-status"><strong>Status:</strong> ${project.status}</p>
      `;

      gallery.appendChild(card);
    });
}

async function buildRoleGrid(data) {

  data.sort((a, b) => a.role.localeCompare(b.role));

  const grid = document.getElementById('roleGrid');
  const searchInput = document.getElementById('searchInputRole');
  const buFilter = document.getElementById('buFilter');

  const modal = document.getElementById('roleModal');
  const modalFolders = document.getElementById('modalFolders');
  const modalRole = document.getElementById('modalRole');
  const modalTrainingLevel = document.getElementById('modalTrainingLevel');
  const modalOCRA = document.getElementById('modalOCRA');
  const modalProjectAdmin = document.getElementById('modalProjectAdmin');
  const modalBU = document.getElementById('modalBU');

  function getUniqueBUs() {
    const buSet = new Set();
    data.forEach(role => {
      (role.bu || []).forEach(b => buSet.add(b.Value));
    });
    return Array.from(buSet).sort();
  }

  function populateBUFilter() {
    const buOptions = getUniqueBUs();
    buOptions.forEach(bu => {
      const option = document.createElement('option');
      option.value = bu;
      option.textContent = bu;
      buFilter.appendChild(option);
    });
  }

  function displayRoles(roles) {
    grid.innerHTML = '';
    roles.forEach(roleObj => {
      const card = document.createElement('div');
      card.className = 'gallery-card';
      card.textContent = roleObj.role;
      card.onclick = () => showModal(roleObj);
      grid.appendChild(card);
    });
  }

  function showModal(roleObj) {
    modalRole.textContent = roleObj.role;
    modalTrainingLevel.textContent = roleObj.trainingLevel || 'N/A';

    roleObj.folderAccess.sort((a, b) => a.Value.localeCompare(b.Value));
    roleObj.projectAdminRoles.sort((a, b) => a.Value.localeCompare(b.Value));

    const listify = (items) => items.map(item => `<li>${item.Value}</li>`).join('');
    modalFolders.innerHTML = listify(roleObj.folderAccess || []);
    modalOCRA.innerHTML = listify(roleObj.ocraRoles || []);
    modalProjectAdmin.innerHTML = listify(roleObj.projectAdminRoles || []);
    modalBU.innerHTML = listify(roleObj.bu || []);

    modal.style.display = 'flex';
  }

  function filterAndDisplay() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedBU = buFilter.value;

    const filtered = data.filter(role => {
      const matchSearch = role.role.toLowerCase().includes(searchTerm);
      const matchBU = !selectedBU || (role.bu || []).some(b => b.Value === selectedBU);
      return matchSearch && matchBU;
    });

    displayRoles(filtered);
  }

  // Event listeners
  searchInput.addEventListener('input', filterAndDisplay);
  buFilter.addEventListener('change', filterAndDisplay);

  window.onclick = e => {
    if (e.target === modal) modal.style.display = 'none';
  };

  // Initial load
  populateBUFilter();
  displayRoles(data);
}

async function populateNSTables(table_array) {
  
  nsArray.forEach(element => {
    const componentArray = table_array.default[element]
    let tableBody = document.querySelector(`#ns_${element}_table tbody`)
    tableBody.innerHTML = ''
    componentArray.forEach(item => {
      const mainRow = document.createElement("tr");
      mainRow.innerHTML = `
        <td>${item.Value}</td>
        <td>${item.Description}</td>
      `
      tableBody.appendChild(mainRow);
    });
  });
  
}

async function getNSData() {
  const headers = {
      "Content-Type": "application/json",
    };
  
    const requestOptions = {
      method: "GET",
      headers: headers,
      //body: JSON.stringify(bodyData),
    };
  
    const apiUrl =
      "https://prod-19.uksouth.logic.azure.com:443/workflows/a51eef6b4ea247928f8e305734b7bd93/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Qul_VuvGcH1WL_8pKak-M-YZNQGSe_DZql0T-Tek1tA";
    //console.log(apiUrl)
    //console.log(requestOptions)
    responseData = await fetch(apiUrl, requestOptions)
      .then((response) => response.json())
      .then((data) => {
        const JSONdata = data;
        console.log(JSONdata);
        return JSONdata;
      })
      .catch((error) => console.error("Error fetching data:", error));
    return responseData;
}

async function getMappingData() {
      
    const headers = {
      "Content-Type": "application/json",
    };
  
    const requestOptions = {
      method: "GET",
      headers: headers,
      //body: JSON.stringify(bodyData),
    };
  
    const apiUrl =
      "https://prod-00.uksouth.logic.azure.com:443/workflows/d4c9c018c4c84c18a8addc3903dbb969/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=VOKHnqDx1hjbyL0c1kjAH56aP2if06udPdmu4X56RwQ";
    //console.log(apiUrl)
    //console.log(requestOptions)
    responseData = await fetch(apiUrl, requestOptions)
      .then((response) => response.json())
      .then((data) => {
        const JSONdata = data;
        console.log(JSONdata);
        //console.log(JSONdata.uploadKey)
        //console.log(JSONdata.urls)
        return JSONdata;
      })
      .catch((error) => console.error("Error fetching data:", error));
    return responseData;
  }

  async function getRoleData() {
      
    const headers = {
      "Content-Type": "application/json",
    };
  
    const requestOptions = {
      method: "GET",
      headers: headers,
      //body: JSON.stringify(bodyData),
    };
  
    const apiUrl =
      "https://prod-60.uksouth.logic.azure.com:443/workflows/b9e23700047948609bfb4cf36a95369c/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Up3Q9sV3xoYvJdF34MBVWi9cxHN_Osozt0uo8cKZerw";
    //console.log(apiUrl)
    //console.log(requestOptions)
    responseData = await fetch(apiUrl, requestOptions)
      .then((response) => response.json())
      .then((data) => {
        const JSONdata = data;
        console.log(JSONdata);
        //console.log(JSONdata.uploadKey)
        //console.log(JSONdata.urls)
        return JSONdata;
      })
      .catch((error) => console.error("Error fetching data:", error));
    return responseData;
  }

async function showLoadingSpinner(container) {
  const loadingSpinner = document.getElementById('loading');

  // Show the loading spinner
  container.style.display = 'none';
  loadingSpinner.style.display = 'block';
}

async function hideLoadingSpinner(container) {
  const loadingSpinner = document.getElementById('loading');

  // Show the loading spinner
  loadingSpinner.style.display = 'none';
  container.style.display = 'block';
}

// Function to show popup with fade-in
function showPopup(title, message,success) {
  const popup = document.getElementById("popup");

  popup.classList.add("show"); // Add 'show' class to make the popup visible
  if(success == false){
    popup.classList.add("failed")
  }
  popup.innerHTML = `<h4>${title}</h4><br><span>${message}</span>`;
  // Hide the popup after 5 seconds with fade-out
  setTimeout(function () {
    popup.classList.remove("show"); // Remove 'show' class to fade it out
  }, 10000);
}

