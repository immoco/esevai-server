const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();
const axios = require('axios');


const app = express();
const port = process.env.PORT || 3000;

// Initialize Firebase Admin SDK

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const sheetID = process.env.Deployment_ID
// const serviceAccount = require('./immo360agency-esevai-firebase-adminsdk-ega3h-d9ade240ae.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

app.use(cors( {origin: 'https://immo360agency-esevai.web.app'} ));
app.use(bodyParser.json());

const sendDataToSheet = async (dataToSend) => {
  try {
    const response = await axios.post(
      `https://script.google.com/macros/s/${sheetID}/exec?dev=true`, 
      dataToSend, // Send `dataToSend` as the body
      {
        headers: {
          'Content-Type': 'application/json', // Specify content type
        },
      }
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    console.log("Data sent successfully to the sheet!");
  } catch (error) {
    console.error("Error sending data to sheet:", error);
  }
};


// Route to saving abandoned applications
app.post('/abandoned', async (req, res) => {
  const abandonedFormData = req.body;
  console.log(abandonedFormData)

  try {
      await sendDataToSheet(abandonedFormData)
      res.status(201).json({ message: 'Abandoned Application Saved!' });
  } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'Error updating the sheet', error });
  }
});

// Route to saving submitted applications
app.post('/submitted', async (req, res) => {
  const submittedFormData = req.body;
  console.log(submittedFormData)
  try {
      await sendDataToSheet(submittedFormData)
      res.status(201).json({ message: 'Application Saved!' });
  } catch (error) {
      console.log(error)
      res.status(500).json({ message: 'Error updating the sheet', error });
  }
});

//Updating the firstore with sheet data
app.post('/update', async (req, res) => {
  const received_data = req.body;
  console.log(received_data)
  console.log(typeof(received_data))


  try {
    const batch = db.batch();
    if (received_data.sheet_name === 'REVENUE'){
      // Loop over each certificate and add it to the batch
      Object.keys(received_data).forEach(certKey => {
        if (certKey !== 'sheet_name'){
          const certData = received_data[certKey];
          console.log(certData)
          const docRef = db.collection('bot_certificates').doc(certKey.toString()); // Each certificate as a document in 'certificates' collection
          batch.set(docRef, certData);
        }
      });
  
      // Commit the batch
      await batch.commit();
      console.log('TN Certificates data populated successfully');
    }

    else if (received_data.sheet_name === 'VOTER ID'){
      // Loop over each certificate and add it to the batch
      Object.keys(received_data).forEach(serKey => {
        if (serKey !== 'sheet_name'){
          const serData = received_data[serKey];
          const docRef = db.collection('voter_id').doc(serKey); // Each certificate as a document in 'certificates' collection
          batch.set(docRef, serData);
        }
      });
  
      // Commit the batch
      await batch.commit();
      console.log('Voter Id Services data populated successfully');
    }

    else if (received_data.sheet_name === 'AADHAR'){
      // Loop over each certificate and add it to the batch

      Object.keys(received_data).forEach((serKey) => {
        if (serKey !== 'sheet_name'){
          const serData = received_data[serKey];
          console.log(serData)
          const docRef = db.collection('aadhar_services').doc(serKey); // Each certificate as a document in 'certificates' collection
          batch.set(docRef, serData);
        } 
      });
  
      // Commit the batch
      await batch.commit();
      console.log('AADHAR Services data populated successfully');
    }
} catch (error) {
    console.error('Error populating data:', error);
}

  // Process the received data (e.g., save to Firestore)
  console.log(received_data);

  // Send response back to Google Apps Script
  res.status(200).send('Data received successfully');
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


