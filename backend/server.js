const express = require('express');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const axios = require('axios');
const path = require('path');
const generateInvoice = require('./generateInvoice');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000

app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

const sendEmail = async (email = [], shipmentData) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    tls: {
      servername: "gmail.com"
    },
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD
    },
    timeout: 60000 // 60 seconds
  });

  // const today = new Date().toLocaleDateString('nl-NL');
  const shipmentDate = new Date(shipmentData.shipmentDateTime).toLocaleDateString('nl-NL');
  const trackAndTraceLink = `${process.env.TRACK_URL}/${shipmentData.transport.trackAndTrace}-${shipmentData.shipmentDetails.countryCode}-${shipmentData.shipmentDetails.zipCode}`;
  const pdfBytes = await generateInvoice(shipmentData)

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Jouw Factuur',
    html: `
      <div style="text-align: center; font-family: Arial, sans-serif;">
        <h3>Bedankt voor uw aankoop</h3>
        <img src="cid:logo" alt="Logo" style="width: 100px; height: auto;">
        <p>Beste ${shipmentData.billingDetails.firstName},</p>
        <p>Bedankt voor uw aankoop.</p>
        <p>Uw bestelling is verzonden.</p>
        <p>Datum van verzending: ${shipmentDate}</p>
        <p>Track en trace: <a href="${trackAndTraceLink}" target="_blank">${shipmentData.transport.trackAndTrace}</a></p>
        <p><a href="${trackAndTraceLink}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #007BFF; text-decoration: none; border-radius: 5px;">Volg uw bestelling</a></p>
        <p>Mocht de link niet werken, kopieer dan onderstaande link.</p>
        <p>${trackAndTraceLink}</p>
        <br/>
        <p>Met vriendelijke groet,</p>
        <p>MijnAPI Team</p>
        <footer style="margin-top: 20px;">
        <p>&copy; ${new Date().getFullYear()} MijnAPI. All rights reserved.</p>
        </footer>
      </div>
    `,
    attachments: [
      {
        filename: 'logo.png',
        path: path.join(__dirname, 'public', 'logo.png'),
        cid: 'logo'
      },
      {
        filename: `jouw-invoice-${shipmentData.order.orderId}.pdf`,
        content: pdfBytes,
        contentType: 'application/pdf'
    }
  ]
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log(error);
    }
    console.log('Email sent: ' + info.response);
  });
};

let accessToken = null;
let tokenExpiration = 0;

// According to the API docs token expires after 5 minutes
// During this 5 minutes we aren't allowed to do the token request
// If we do token request during this 5 minutes our IP will be blocked by Platform
// To prevent this IP blockage I added a timer. During this timer it doesn't do token request
const getAccessToken = async () => {
  try {
    if (!accessToken || Date.now() >= tokenExpiration) {
    const apiUrl = process.env.ACCESS_URL
    const credentials = process.env.CREDENTIALS

    const requestData = {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      }
    };
    const response = await axios.post(apiUrl, null, requestData);

    accessToken = response.data.access_token;
    tokenExpiration = Date.now() + 600000;
    }
    return accessToken;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // Log the error response if a 401 error occurs
      console.error('Token request failed with status 401:', error.response.data);
    } else {
      // Handle other errors
      console.error('Error:', error.message);
    }
    throw new Error('Failed to obtain access token');
  }
}

const getTodayShipments = async () => {
  try {
    const accessToken = await getAccessToken();

    const apiUrl = `${process.env.BASE_URL}/shipments?fulfilment-method=FBR`
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.retailer.v10+json',
    };
    const response = await axios.get(apiUrl, { headers });

    const shipments = response.data.shipments;
    const today = new Date().toISOString().split('T')[0];  // Get today's date in YYYY-MM-DD format
    const todayShipments = shipments.filter(shipment => {
      return shipment.shipmentDateTime.startsWith(today);
    });  
    return todayShipments.map(shipment => shipment.shipmentId)
  } catch (error) {
      console.error('Error fetching shipments:', error);
      return [];
  }
}

// Get Shipment By Id
const getShipmentById = async (shipmentId) => {
  try {
    const accessToken = await getAccessToken();

    const apiUrl = `${process.env.BASE_URL}/shipments/${shipmentId}`
    const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.retailer.v10+json',
    };
    const response = await axios.get(apiUrl, { headers });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // Log the error response if a 401 error occurs
      console.error('Token request failed with status 401:', error.response.data);
    } else {
      // Handle other errors
      console.error('Error:', error.message);
    }
    throw new Error(`Couldn't find ${shipmentId} or Failed to obtain access token`);
  }
}

// Fetch shipment IDs and customer emails, then send emails
cron.schedule('0 20 * * *', 
  async () => {
  //  this line is for test 
    // const fireApp = async () => {
    try {
      const shipmentIds = await getTodayShipments();
      console.log(`Number of shipments ${shipmentIds.length}`)
      console.log(`${shipmentIds}`)
      for (const shipmentId of shipmentIds) {
        const shipmentData = await getShipmentById(shipmentId)
        await sendEmail([`${shipmentData.billingDetails.email}`], shipmentData)
      }

    } catch (error) {
        console.error('Error in scheduled task:', error);
    }
  }
)

// Test run command
// fireApp()

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
