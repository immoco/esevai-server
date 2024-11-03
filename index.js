const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 3001;

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
    const response = await fetch(`https://script.google.com/macros/s/${sheetID}/exec?dev=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSend),
    });

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
  const certificatesData = req.body;

  try {
    const batch = db.batch();

    // Loop over each certificate and add it to the batch
    Object.keys(certificatesData).forEach(certKey => {
        const certData = certificatesData[certKey];
        const docRef = db.collection('certificates').doc(certKey); // Each certificate as a document in 'certificates' collection
        batch.set(docRef, certData);
    });

    // Commit the batch
    await batch.commit();
    console.log('Certificates data populated successfully');
} catch (error) {
    console.error('Error populating data:', error);
}

  // Process the received data (e.g., save to Firestore)
  console.log(certificatesData);

  // Send response back to Google Apps Script
  res.status(200).send('Data received successfully');
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


