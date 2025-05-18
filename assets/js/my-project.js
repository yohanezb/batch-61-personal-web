document.getElementById("form").addEventListener("submit", addProject);

let projects = [];

function addProject(e) {
  e.preventDefault();

  let projectTitle = document.getElementById("name").value;
  let startDate = document.getElementById("project-start-date").value;
  let endDate = document.getElementById("project-end-date").value;
  let projectDescription = document.getElementById("project-description").value;
  let projectImage = document.getElementById("project-img").files[0];

  let selectedTechnologies = [];
  if (document.getElementById("node-js").checked) {
    selectedTechnologies.push(`<img src="assets/img/node-js.png" class="icon"/>`);
  }
  if (document.getElementById("next-js").checked) {
    selectedTechnologies.push(`<img src="assets/img/next-js.png" class="icon"/>`);
  }
  if (document.getElementById("react-js").checked) {
    selectedTechnologies.push(`<img src="assets/img/react-js.png" class="icon"/>`);
  }
  if (document.getElementById("typescript").checked) {
    selectedTechnologies.push(`<img src="assets/img/typescript.png" class="icon"/>`);
  }


let imageURL = URL.createObjectURL(projectImage);

let project = {
  title: projectTitle,
  startDate,
  endDate,
  duration: calculateDuration(startDate, endDate),
  description: projectDescription,
  technologies: selectedTechnologies,
  image: imageURL,
  createdAt: new Date(),
};


  projects.push(project);
  renderProjects();
}

function calculateDuration(start, end) {
  let startDate = new Date(start);
  let endDate = new Date(end);

  if (endDate < startDate) {
    return "End date must be after start date";
  }

  let diffTime = endDate - startDate;
  let totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (totalDays >= 365) {
    let years = Math.floor(totalDays / 365);
    return `${years} year`;
  } else if (totalDays >= 30) {
    let months = Math.floor(totalDays / 30);
    return `${months} month`;
  } else if (totalDays >= 7) {
    let weeks = Math.floor(totalDays / 7);
    return `${weeks} week`;
  } else {
    return `${totalDays} day`;
  }
}



function renderProjects() {
  let projectList = document.getElementById("projectList");
  projectList.innerHTML = "";

  projects.forEach((project, index) => {
    projectList.innerHTML += `

      <div class="col-md-4">
          <div class="card shadow-sm card-container p-2">
              <img src="${project.image}" class="card-img-top card-img">
              <div class="card-body p-0 pt-2">
                  <h4 class="card-title">${project.title}</h4>
                  <h5 class="card-title">Durasi : ${project.duration}</h5>
                  <div class="card-text-container pt-2 pb-2">
                      <p class="card-text">${project.description}</p>
                  </div>
                  <div class="mb-2">
                      ${project.technologies.join("")}
                  </div>
                  <div class="d-flex justify-content-between">
                      <a href="#" class="btn btn-dark btn-sm card-btn">edit</a>
                      <a href="#" class="btn btn-dark btn-sm card-btn">delete</a>
                  </div>
              </div>
          </div>
      </div>
    `;
  });
}


