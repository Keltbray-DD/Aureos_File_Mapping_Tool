document.addEventListener("DOMContentLoaded", async function () {
    document.getElementById("appInfo").textContent = `${appName} ${appVersion}`;
    const galleryContainer = document.getElementById('galleryContainer')
    const gallery = document.getElementById('projectGallery');
    const searchInput = document.getElementById('searchInput');
    //const statusFilter = document.getElementById('statusFilter');
    await showLoadingSpinner(galleryContainer)
    mappingData = await geMappingData()
    roleData = await getRoleData()
    const tree = buildTree(mappingData.folders);
    await buildRoleGrid(roleData)
    document.getElementById("folderTree").appendChild(renderTree(tree));
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

    // Event listeners
    searchInput.addEventListener('input', filterProjects);
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



})

function toggleTab(containerId) {
  const allTabs = document.querySelectorAll('.tab-content');
  const buttons = document.querySelectorAll('.tab-button');

  allTabs.forEach(tab => {
    tab.classList.remove('active');
  });

  buttons.forEach(btn => {
    btn.classList.remove('active');
  });

  document.getElementById(containerId).classList.add('active');
  event.target.classList.add('active');
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

async function geMappingData() {
      
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