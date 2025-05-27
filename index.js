//import
import express from "express";
import path from "path";
import multer from "multer";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Pool } from "pg";
import hbs from 'hbs';



// Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

hbs.registerHelper('includes', function(array, value) {
  if (!Array.isArray(array)) return false;
  return array.includes(value);
});

hbs.registerHelper('eq', function (a, b) {
  return a === b;
});

hbs.registerPartials(path.join(__dirname, 'views/partials'));

const app = express();
const PORT = 3000;

let projects = [];

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.urlencoded({ extended: false }));


const db = new Pool({
  user: "postgres",
  host: "localhost",
  database: "b61-personalweb",
  password: "password",
  port: 5432,
});

// Routingan

app.get("/", (req, res) => {
  res.render("index", { activePage: "home" });
});

app.get("/my-project", project);
app.get("/contact", contact);

app.get("/delete-project/:id", deleteProject);

// Render

function contact(req, res) {
  res.render("contact"); 
}


// img
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'assets/img'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// handle project

async function project(req, res) {
  try {
    const result = await db.query('SELECT * FROM projects');
    const rows = result.rows.map(project => {
      const techArray = project.technologies
        ? project.technologies.replace(/[{}"]/g, '').split(',')
        : [];

      return {
        ...project,
        duration: calculateDuration(project.start_date, project.end_date),
        technologies: techArray,
        image: `/assets/img/${project.image}`,
      };
    });

    res.render("my-project", { projects: rows , activePage: "my-project"});
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch projects");
  }
}


app.get("/project-detail/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const result = await db.query("SELECT * FROM projects WHERE id = $1", [id]);
    const project = result.rows[0];

    if (!project) return res.status(404).send("Project not found");

    const startDate = new Date(project.start_date);
    const endDate = new Date(project.end_date);

    // PARSING technologies dari string "{""node-js"",""next-js""}" jadi array
    const techArray = project.technologies
      ? project.technologies.replace(/[{}"]/g, '').split(',')
      : [];

    const formattedProject = {
      ...project,
      image: `/assets/img/${project.image}`,
      startDate: startDate.toLocaleDateString("en-GB"),
      endDate: endDate.toLocaleDateString("en-GB"),
      duration: calculateDuration(startDate, endDate),
      technologies: techArray
    };

    res.render("project-detail", { title: project.title, ...formattedProject });
  } catch (error) {
    console.error("Error fetching project detail:", error);
    res.status(500).send("Failed to load project details");
  }
});


app.post('/add-project', upload.single('project-img'), async (req, res) => {
  try {
    const { 
      name, 
      'project-start-date': startDate,
      'project-end-date': endDate,
      'project-description': description,
    } = req.body;

    const technologies = [];
    if (req.body['node-js']) technologies.push('node-js');
    if (req.body['next-js']) technologies.push('next-js');
    if (req.body['react-js']) technologies.push('react-js');
    if (req.body['typescript']) technologies.push('typescript');

    const project = {
      title: name,
      startDate,
      endDate,
      duration: calculateDuration(startDate, endDate),
      description,
      technologies,
      image: `/assets/img/${req.file.filename}`,
    };

    //insert db
    await db.query(
      `INSERT INTO projects (title, start_date, end_date, description, technologies, image)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        project.title,
        project.startDate,
        project.endDate,
        project.description,
        project.technologies,
        req.file.filename,
      ]
    );


    res.redirect('/my-project');
  } catch (error) {
    console.error("Error inserting project:", error);
    res.status(500).send("Internal Server Error");
  }
});


//Edit Project
app.get("/edit-project/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query("SELECT * FROM projects WHERE id = $1", [id]);
    const project = result.rows[0];

    if (!project) return res.status(404).send("Project not found");

    project.start_date = formatDate(project.start_date);
    project.end_date = formatDate(project.end_date);

    // Convert/Parsing
    const techArray = project.technologies
      ? project.technologies.replace(/[{}"]/g, '').split(',')
      : [];

    project.image = `/assets/img/${project.image}`;

    res.render("edit-project", {
      project: {
        ...project,
        technologies: techArray,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Edit error");
  }
});

//update edited project
app.post("/update-project/:id", upload.single("project-img"), async (req, res) => {
  const id = req.params.id;
  const {
    name,
    'project-start-date': startDate,
    'project-end-date': endDate,
    'project-description': description,
  } = req.body;

  const technologies = [];
  if (req.body['node-js']) technologies.push('node-js');
  if (req.body['next-js']) technologies.push('next-js');
  if (req.body['react-js']) technologies.push('react-js');
  if (req.body['typescript']) technologies.push('typescript');

  const updateQuery = `
    UPDATE projects
    SET title=$1, start_date=$2, end_date=$3, description=$4, technologies=$5
    ${req.file ? ', image=$6' : ''}
    WHERE id=$${req.file ? '7' : '6'}
  `;

  const values = req.file
    ? [name, startDate, endDate, description, technologies, req.file.filename, id]
    : [name, startDate, endDate, description, technologies, id];

  try {
    await db.query(updateQuery, values);
    res.redirect("/my-project");
  } catch (err) {
    console.error(err);
    res.status(500).send("Update failed");
  }
});

//Delete project
function deleteProject(req, res) {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    console.error("Invalid ID:", req.params.id);
    return res.status(400).send("Invalid project ID");
  }

  db.query("DELETE FROM projects WHERE id = $1", [id])
    .then(() => {
      res.redirect("/my-project");
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Delete failed");
    });
}


// duration formula
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
    return `${years} year${years > 1 ? "s" : ""}`;
  } else if (totalDays >= 30) {
    let months = Math.floor(totalDays / 30);
    return `${months} month${months > 1 ? "s" : ""}`;
  } else if (totalDays >= 7) {
    let weeks = Math.floor(totalDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""}`;
  } else {
    return `${totalDays} day${totalDays > 1 ? "s" : ""}`;
  }
}

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
