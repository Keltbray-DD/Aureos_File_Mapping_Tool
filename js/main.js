document.addEventListener("DOMContentLoaded", async function () {
    document.getElementById("appInfo").textContent = `${appName} ${appVersion}`;
    const gallery = document.getElementById('projectGallery');
    const searchInput = document.getElementById('searchInput');
    //const statusFilter = document.getElementById('statusFilter');

    mappingData = await geMappingData()

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
})

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