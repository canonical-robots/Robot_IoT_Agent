const NGSI = require("ngsijs");
const net = require("net");

const connection = new NGSI.Connection("http://orion:1026");

const express = require("express");
const app = express();
const port = 3000;

const ELFIN_SERVER_HOST = "elfin_emulator"; // Change to the server's hostname or IP address
const ELFIN_SERVER_PORT = 2500; // Change to the server's port number

const NGSI_ENTITY_ID = "ElfinRobot001";
const NGSI_ENTITY_TYPE = "ElfinRobot";
const ADAPTER_ADDRESS = "elfin-adapter";

//------------------------
// Mapping Elfin to NGSIv2
//------------------------

// Datasheet template
const datasheet = {
  PosAndVel: {
    Actual_Position: [
      "-180.314",
      "-2.028",
      "90.035",
      "1.648",
      "83.557",
      "-112.772",
      "-751.997",
      "-7.533",
      "427.782",
      "-175.325",
      "-0.174",
      "112.329",
    ],
    Actual_PCS_TCP: [
      "-751.997",
      "-7.533",
      "427.782",
      "-175.325",
      "-0.174",
      "112.329",
    ],
    Actual_PCS_Base: [
      "-733.627",
      "-0.776",
      "666.983",
      "-175.325",
      "-0.174",
      "112.329",
    ],
    Actual_PCS_Tool: ["0.000", "0.000", "0.000", "0.000", "0.000", "0.000"],
    Actual_Joint_Current: [
      "-0.049",
      "3.739",
      "-5.527",
      "-0.440",
      "0.053",
      "0.073",
    ],
    Actual_Joint_Velocity: [
      "0.017",
      "0.000",
      "0.000",
      "0.000",
      "0.000",
      "0.000",
    ],
    Actual_Joint_Acceleration: [
      "0.004",
      "0.008",
      "0.003",
      "-0.006",
      "0.008",
      "-0.010",
    ],
    Actual_Override: "1.000",
  },
  EndIO: {
    EndDI: [0, 0, 0, 0],
    EndDO: [0, 0, 0, 0],
    EndButton: [0, 0, 0, 0],
    EnableEndBTN: 0,
    EndAI: ["0.000", "0.000"],
  },
  ElectricBoxIO: {
    BoxCI: [0, 0, 0, 0, 0, 0, 0, 0],
    BoxCO: [0, 0, 0, 0, 0, 0, 0, 0],
    BoxDI: [0, 0, 0, 0, 0, 0, 0, 0],
    BoxDO: [0, 0, 0, 0, 0, 0, 0, 0],
    Conveyor: "0.000",
    Encode: 0,
  },
  ElectricBoxAnalogIO: {
    BoxAnalogOutMode_1: 0,
    BoxAnalogOutMode_2: 0,
    BoxAnalogOut_1: "0.000",
    BoxAnalogOut_2: "0.000",
    BoxAnalogIn_1: "-0.012",
    BoxAnalogIn_2: "-0.049",
  },
  StateAndError: {
    robotState: 33,
    robotEnabled: 1,
    robotPaused: 0,
    robotMoving: 0,
    robotBlendingDone: 1,
    InPos: 0,
    Error_AxisID: 0,
    Error_Code: 0,
    IsReduceMode: 0,
    BrakeState: [0, 0, 0, 0, 0, 0],
    nAxisStatus: [3, 3, 3, 3, 3, 3],
    nAxisErrorCode: [0, 0, 0, 0, 0, 0],
    nResetSafeSpace: [1],
    nAxisGroupStatus: [1],
    nAxisGroupErrorCode: [0],
  },
  HardLoad: {
    EtherCAT_TotalFrame: 40948973,
    EtherCAT_FramesPerSecond: 251,
    EtherCAT_TotalLostFrame: 88,
    EtherCAT_TxErrorFrame: 11,
    EtherCAT_RxErrorFrame: 1104,
    Box48IN_Voltage: "48.210",
    Box48IN_Current: "0.767",
    Box48Out_Voltage: "48.056",
    Box48Out_Current: "0.767",
    Slave_temperature: ["44.812", "57.000", "56.125"],
    Slave_Voltage: ["47.990", "48.213", "47.990"],
  },
  FTData: {
    FTControlState: 0,
    FTData: ["0.000", "0.000", "0.000", "0.000", "0.000", "0.000"],
    FTSrcData: ["0.000", "0.000", "0.000", "0.000", "0.000", "0.000"],
  },
  RobotAuthorization: {
    DynDeviceCode: "061812",
    AuthorizedTimeLeftMinutes: "166878",
    AuthorizedTimeUsedMinutes: "92322",
  },
  Script: {
    errorCode: "0",
    cmdid: ["", "", "", "", "", ""],
    GlobalVar: [
      {
        a: "-0.5",
      },
      {
        b: "3.0",
      },
      {
        t90: "90.0",
      },
      {
        t_90: "-90.0",
      },
    ],
  },
};

// "mapKeys" is an auxiliary function to process the Elfin's datasheet template.
// It transforms a selection of nested DataSheet keys into first level keys
// The object "enhancedDatasheet" results as a new Datasheet with the additional keys
function mapKeys(sourceObj, keyMap) {
  const resultObj = {}; // Include the original object as "original" key

  for (const sourceKey in keyMap) {
    if (Object.prototype.hasOwnProperty.call(keyMap, sourceKey)) {
      const targetKey = keyMap[sourceKey];
      const sourceValue = getSourceValue(sourceObj, sourceKey);

      if (sourceValue !== undefined) {
        setTargetValue(resultObj, targetKey, sourceValue);
      }
    }
  }

  return resultObj;
}

function getSourceValue(obj, key) {
  const keys = key.split(".");
  let value = obj;

  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(value, k)) {
      value = value[k];
    } else {
      return undefined; // Key not found
    }
  }

  return value;
}

function setTargetValue(obj, key, value) {
  const keys = key.split(".");
  let target = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!Object.prototype.hasOwnProperty.call(target, k)) {
      target[k] = {};
    }
    target = target[k];
  }

  const lastKey = keys[keys.length - 1];
  target[lastKey] = value;
}

// 'keyMap' determines the structure of the enhanced Datasheet object
// 'Keys' in this keyMap MUST match the path of one single key in the Elfin datasheet.
// 'Values' in this key map determine the name of the new -first level- Key to be created
const keyMap = {
  "PosAndVel.Actual_PCS_TCP": "Actual_PCS_TCP",
  "StateAndError.robotMoving": "robotMoving",
  "StateAndError.InPos": "InPos",
  "StateAndError.robotEnabled": "robotEnabled",
  "StateAndError.Error_Code": "Error_Code",
  "StateAndError.Error_AxisID": "Error_AxisID",
  EndIO: "EndIO",
  ElectricBoxIO: "ElectricBoxIO",
  ElectricBoxAnalogIO: "ElectricBoxAnalogIO",
};

// The enhanced datasheet cosists of
// - the original datasheet, which is attached to the key "datasheet"
// - the series of keys which were asked to be transformed into first level attrs
// - the "id" and "type" attributes to be used in the NGSI entity
// - the "command" attribute, which sends southbound commands from NGSI to Elfin
const enhancedDatasheet = mapKeys(datasheet, keyMap);
for (const key in keyMap) {
  if (Object.prototype.hasOwnProperty.call(datasheet, key)) {
    enhancedDatasheet[mapKeys[key]] = "init";
  }
}
enhancedDatasheet.id = NGSI_ENTITY_ID;
enhancedDatasheet.type = NGSI_ENTITY_TYPE;
enhancedDatasheet.datasheet = datasheet;
enhancedDatasheet.command = "IDLE";
enhancedDatasheet.command_status = Buffer.from("IDLE,;").toString('base64');
enhancedDatasheet.command_info = Buffer.from("IDLE,;").toString('base64');

//--------------------------
// Setting Up the connection
//--------------------------
const client = new net.Socket();

// Conenction to the Robot
client.connect(ELFIN_SERVER_PORT, ELFIN_SERVER_HOST, () => {
  console.log(
    `Connected to server at ${ELFIN_SERVER_HOST}:${ELFIN_SERVER_PORT}`
  );
  // Send a "Hello, World!" message to the server
  client.write("Hello, World!");
  // Connect to and Create the NGSIv2 Entity in Orion Context Broker
  connection.v2.createEntity(enhancedDatasheet, { keyValues: true }).then(
    (response) => {
      console.log(response);
      // Entity created successfully
      // response.correlator transaction id associated with the server response
    },
    (error) => {
      console.log(error);
      // Error creating the entity
      // If the error was reported by Orion, error.correlator will be
      // filled with the associated transaction id
    }
  );
});

client.on("close", () => {
  console.log("Connection to server closed.");
});

client.on("error", (err) => {
  console.error("Socket error:", err);
});

// Nothbound Traffic:
// - Sending robot data to the Orion Context Broker
//-------------------------------------------------
client.on("data", (data) => {
  // Assuming the server sends complete JSON objects, parse and print them
  const jsonStr = data.toString();
  let updatedAttributes = {};
  try {
    const jsonObject = JSON.parse(jsonStr);
    if (Object.prototype.hasOwnProperty.call(jsonObject, "success"))
    {
      updatedAttributes.command_status = Buffer.from(jsonObject.success).toString('base64');
      updatedAttributes.command_info = Buffer.from(jsonObject.success).toString('base64');
    }
    else
    {
      updatedAttributes = mapKeys(jsonObject, keyMap);
      for (const key in keyMap) {
        if (Object.prototype.hasOwnProperty.call(jsonObject, key)) {
          updatedAttributes[mapKeys[key]] = jsonObject[key];      
        }
      }
      updatedAttributes.datasheet = jsonObject;
    }
    updatedAttributes.id = NGSI_ENTITY_ID;
    connection.v2
      .updateEntityAttributes(updatedAttributes, { keyValues: true })
      .then(
        (response) => {
          // Attributes updated successfully
          // response.correlator transaction id associated with the server response
          // console.log(response.correlator);
        },
        (error) => {
          // Error updating the attributes of the entity
          // If the error was reported by Orion, error.correlator will be
          // filled with the associated transaction id
          // console.log(error);
        }
      );
  } catch (err) {
    console.error("Error parsing JSON:", err);
  }
});

// Southbound Traffic:
// - HTTP Middleware sending Orion Context Broker
//   notifications to the robot
//-----------------------------------------------

// Middleware to parse JSON data from POST requests
app.use(express.json());

// Respond to GET requests at the root path ('/')
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// Handle POST requests at the '/notify' path
app.post("/notify", (req, res) => {
  // Access the JSON data from the request body
  const postData = req.body;

  // Handle the received data as needed
  console.log("Received POST data:", postData);
  console.log(postData.data[0].command.value);
  // Send the Southbound command to the Elfin robot
  client.write(postData.data[0].command.value);
  // Respond with a confirmation message
  res.json({ message: "Notification received successfully" });
});

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Server is running on http://${ADAPTER_ADDRESS}:${port}/`);
});

// Prepare the actuation bridge for NGSIv2
// - Subscribe to the attribute "command"
// - Create the attribute "command_status" (execution feedback)
// - Create the attribute "command_info"   (final result) 
connection.v2
  .createSubscription({
    description: "Southbound commands from NGSI to Elfin Robot",
    subject: {
      entities: [
        {
          id: NGSI_ENTITY_ID,
          type: NGSI_ENTITY_TYPE,
        },
      ],
      condition: {
        attrs: ["command"],
      },
    },
    notification: {
      http: {
        url: "http://elfin-adapter:3000/notify",
      },
      attrs: ["command"],
    },
    //},
    //"throttling": 5
  })
  .then(
    (response) => {
      // Subscription created successfully
      // response.correlator transaction id associated with the server response
      //console.log(response.correlator);
    },
    (error) => {
      // Error creating the subscription
      // If the error was reported by Orion, error.correlator will be
      // filled with the associated transaction id
      //console.log(error);
    }
  );
