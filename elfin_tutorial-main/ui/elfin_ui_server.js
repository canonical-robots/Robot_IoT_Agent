const NGSI = require('ngsijs');
const express = require('express');
const path = require('path'); // Import the 'path' module

const UI_ADDRESS = "elfin-tutorial-ui";
const UI_PORT = 3003;
const connection = new NGSI.Connection("http://orion:1026");

const app = express(); // Create an Express application

var elfin_entity = {};

// Middleware to parse JSON data from POST requests
app.use(express.json());

// Serve the "elfin_ui.html" file when a GET request is made to the root path ('/')
app.get('/', (req, res) => {
  // Construct the full path to the HTML file using __dirname
  const htmlFilePath = path.join(__dirname, 'elfin_ui.html');
  
  // Send the HTML file as the response
  res.sendFile(htmlFilePath);
});

// Serve the value of "elfin_entity" to the ui
app.get('/elfin_entity', (req, res) => {
  res.json(elfin_entity);
});

// Handle POST requests at the '/notify' path
app.post('/notify', (req, res) => {
  // Access the JSON data from the request body
  const postData = req.body;

  // Handle the received data as needed
  console.log('Received POST data:', postData);

  // Respond with a confirmation message
  res.json({ message: 'Notification received successfully' });
});
app.post('/command', (req, res) => {
  // Access the JSON data from the request body
  const postData = req.body;
  console.log(postData);
  console.log(postData["command"]);
  try {
    var updatedAttributes = {};
    updatedAttributes["id"] = "ElfinRobot001";
    updatedAttributes["command"] = postData["command"];
    connection.v2.updateEntityAttributes(
    updatedAttributes, 
    {
        keyValues: true
    }).then(
        (response) => {
            // Attributes updated successfully
            // response.correlator transaction id associated with the server response
        }, (error) => {
            // Error updating the attributes of the entity
            // If the error was reported by Orion, error.correlator will be
            // filled with the associated transaction id
        }
    );
  } catch (err) {
    console.error('Error parsing JSON:', err);
  }

  // Respond with a confirmation message
  res.json({ message: 'Notification received successfully' });
});

// Start the server and listen on the specified port
app.listen(UI_PORT, () => {
  console.log(`Server is running on http://${UI_ADDRESS}:${UI_PORT}/`);
});

// Function to load JSON response into elfin_entity object
function loadElfinEntity() {
  connection.v2.getEntity("ElfinRobot001").then(
      (response) => {
          // Entity details retrieved successfully
          elfin_entity = response.entity;
          //console.log(JSON.stringify(elfin_entity, null, 2));
      },
      (error) => {
          // Error retrieving entity
          console.error('Error retrieving entity:', error);
      }
  );
}

// Load JSON data initially
loadElfinEntity();

// Poll for updates every 500 miliseconds
setInterval(loadElfinEntity, 500);

/*connection.v2.updateEntityAttributes({
  "id": "ElfinRobot001",
  "command": "Go go Johny go go go"
}, {
  keyValues: true
}).then(
  (response) => {
    console.log(response);
    // Attributes updated successfully
    // response.correlator transaction id associated with the server response
  }, (error) => {
    console.log(error);
    // Error updating the attributes of the entity
    // If the error was reported by Orion, error.correlator will be
    // filled with the associated transaction id
  }
);*/

