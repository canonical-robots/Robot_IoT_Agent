const net = require('net');
const PORT = 2500; // Change this to the desired port number
const DELAY_MS = 200; // 5Hz = 200ms delay
const send_datasheet = true;
var controllerOnOff = true; // true  (On) simulates the robot moving (Actual_PCS_TCP changes)
                            // false (Off) simulates the robot stopped (Actual_PCS_TCP static)

//-------------------------
// Elfin Datasheet Template
//-------------------------
const datasheet = 
{
  "PosAndVel": {
    "Actual_Position": [ "-180.314", "-2.028", "90.035", "1.648", "83.557", "-112.772", "-751.997", "-7.533", "427.782", "-175.325", "-0.174", "112.329" ],
    "Actual_PCS_TCP": [ "-751.997", "-7.533", "427.782", "-175.325", "-0.174", "112.329" ],
    "Actual_PCS_Base": [ "-733.627", "-0.776", "666.983", "-175.325", "-0.174", "112.329" ],
    "Actual_PCS_Tool": [ "0.000", "0.000", "0.000", "0.000", "0.000", "0.000" ],
    "Actual_Joint_Current": [ "-0.049", "3.739", "-5.527", "-0.440", "0.053", "0.073" ],
    "Actual_Joint_Velocity": [ "0.017", "0.000", "0.000", "0.000", "0.000", "0.000" ],
    "Actual_Joint_Acceleration": [ "0.004", "0.008", "0.003", "-0.006", "0.008", "-0.010" ],
    "Actual_Override": "1.000"
  },
  "EndIO": {
    "EndDI": [ 0, 0, 0, 0 ],
    "EndDO": [ 0, 0, 0, 0 ],
    "EndButton": [ 0, 0, 0, 0 ],
    "EnableEndBTN": 0,
    "EndAI": [ "0.000", "0.000" ]
  },
  "ElectricBoxIO": {
    "BoxCI": [ 0, 0, 0, 0, 0, 0, 0, 0 ],
    "BoxCO": [ 0, 0, 0, 0, 0, 0, 0, 0 ],
    "BoxDI": [ 0, 0, 0, 0, 0, 0, 0, 0 ],
    "BoxDO": [ 0, 0, 0, 0, 0, 0, 0, 0 ],
    "Conveyor": "0.000",
    "Encode": 0
  },
  "ElectricBoxAnalogIO": {
    "BoxAnalogOutMode_1": 0,
    "BoxAnalogOutMode_2": 0,
    "BoxAnalogOut_1": "0.000",
    "BoxAnalogOut_2": "0.000",
    "BoxAnalogIn_1": "-0.012",
    "BoxAnalogIn_2": "-0.049"
  },
  "StateAndError": {
    "robotState": 33,
    "robotEnabled": 1,
    "robotPaused": 0,
    "robotMoving": 0,
    "robotBlendingDone": 1,
    "InPos": 0,
    "Error_AxisID": 0,
    "Error_Code": 0,
    "IsReduceMode": 0,
    "BrakeState": [ 0, 0, 0, 0, 0, 0 ],
    "nAxisStatus": [ 3, 3, 3, 3, 3, 3 ],
    "nAxisErrorCode": [ 0, 0, 0, 0, 0, 0 ],
    "nResetSafeSpace": [ 1 ],
    "nAxisGroupStatus": [ 1 ],
    "nAxisGroupErrorCode": [ 0 ]
  },
  "HardLoad": {
    "EtherCAT_TotalFrame": 40948973,
    "EtherCAT_FramesPerSecond": 251,
    "EtherCAT_TotalLostFrame": 88,
    "EtherCAT_TxErrorFrame": 11,
    "EtherCAT_RxErrorFrame": 1104,
    "Box48IN_Voltage": "48.210",
    "Box48IN_Current": "0.767",
    "Box48Out_Voltage": "48.056",
    "Box48Out_Current": "0.767",
    "Slave_temperature": [ "44.812", "57.000", "56.125" ],
    "Slave_Voltage": [ "47.990", "48.213", "47.990" ]
  },
  "FTData": {
    "FTControlState": 0,
    "FTData": [ "0.000", "0.000", "0.000", "0.000", "0.000", "0.000" ],
    "FTSrcData": [ "0.000", "0.000", "0.000", "0.000", "0.000", "0.000" ]
  },
  "RobotAuthorization": {
    "DynDeviceCode": "061812",
    "AuthorizedTimeLeftMinutes": "166878",
    "AuthorizedTimeUsedMinutes": "92322"
  },
  "Script": {
    "errorCode": "0",
    "cmdid": [ "", "", "", "", "", "" ],
    "GlobalVar": [
      {
        "a": "-0.5"
      },
      {
        "b": "3.0"
      },
      {
        "t90": "90.0"
      },
      {
        "t_90": "-90.0"
      }
    ]
  }
};

//-----------------------------------------------------------------
// TCPIP Server sends the Elfin's datasheet as a continuous stream
// as a simulator of the Elfin Robot output data stream
//-----------------------------------------------------------------
var my_elfin_object = datasheet;

// Create a TCP server which periodically sends the enhanced datasheet
const server = net.createServer((socket) => {
  console.log('Client connected.');

  // Function to send my_elfin_object to the client
  const sendMyElfinObject = () => {
    if (controllerOnOff == true)
    {
      // Simulate a change in the values of "Actual_PCS_TCP" 
      let newPCS_TCP = my_elfin_object["PosAndVel"]["Actual_PCS_TCP"].map(element => {
        const randomNumber = Math.random() * 3 - 1.5; // Generates a random number between -1.5 and 1.5
        return (parseFloat(element) + randomNumber).toFixed(3);
      });
      my_elfin_object["PosAndVel"]["Actual_PCS_TCP"] = newPCS_TCP;
    }
    // Send the datasheet
    socket.write(JSON.stringify(my_elfin_object));
  };

  // Send my_elfin_object initially
  sendMyElfinObject();

  // Periodically send my_elfin_object at the specified rate
  const intervalId = setInterval(sendMyElfinObject, DELAY_MS);
  if (send_datasheet == false)
    clearInterval(intervalId);

  // Handle client disconnection
  socket.on('end', () => {
    console.log('Client disconnected.');
    clearInterval(intervalId); // Stop sending updates when the client disconnects
  });
  
  // Handle data received from the client
  socket.on('data', (data) => {
    const receivedData = data.toString();
    console.log('Received Command:');
    console.log(receivedData);
    if (String(data).includes("stop"))
    {
      controllerOnOff = false;
    }
    else if (String(data).includes("move"))
    {
      controllerOnOff = true;
    }
    let response = { success: receivedData+",OK,;", };
    // Send the response to the command
    console.log(response);
    socket.write(JSON.stringify(response));
  });

  // Handle errors
  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
