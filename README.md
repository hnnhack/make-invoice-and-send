# Invoice Automation App

## Table of Contents

- [Explanation](#explanation)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Explanation

This Node.js and Express-based application is designed to automate the daily invoicing process. By leveraging a suite of powerful libraries, the app seamlessly integrates data retrieval, PDF generation, email communication, and task scheduling to streamline your workflow.

## Features

- **Data Retrieval**: Utilizes `axios` to fetch data from a REST API.
- **Invoice Generation**: Uses `pdf-lib` to create professional-grade PDF invoices.
- **Email Automation**: Employs `node-mailer` to generate emails, attach invoices, and send them to clients.
- **Task Scheduling**: Schedules the entire process to run automatically every day at 8 PM using `node-cron`.

## How It Works

1. **Fetch Data**: The app makes a REST API call at the scheduled time to retrieve the necessary data.
2. **Generate Invoice**: Using the fetched data, the app creates a detailed PDF invoice.
3. **Send Email**: An email is generated with the invoice attached and sent to the specified client.
4. **Automation**: The entire process is scheduled to run daily at 8 PM, ensuring timely invoicing without manual intervention.

This app is designed to simplify and automate your invoicing process, saving you time and reducing the potential for errors.

## Technologies Used

- **Node.js**: The runtime environment.
- **Express**: The web framework for handling server and routing.
- **axios**: For making HTTP requests to the REST API.
- **pdf-lib**: For generating PDF invoices.
- **node-mailer**: For creating and sending emails with attachments.
- **node-cron**: For scheduling the automated tasks.


## Installation

Description of installation is below this line.

```bash
# Example command to clone the repository
git clone https://github.com/hnnhack/make-invoice-and-send.git

# Example command to install dependencies
npm install

```

## Usage

Enter your credentials in to the .env file.

```bash

# Example command to .env file

PORT=5000
EMAIL="jouw-email@gmail.com"
PASSWORD="EMAIL PASS CODE"
CREDENTIALS='CREDENTIAL VOOR TOKEN REQUEST HIERVOOR MOET JE DOCS LEZEN'
ACCESS_URL='https://PLATFORMloginURL.com/token?TOKEN_type=jouw_credentials'
TRACK_URL='https://jouw.leverancier.nl/track-and-trace'
BASE_URL='https://platform/base/url'

```

## Contributing

### Guidelines for contributing to the project.

1. Fork the repository.
2. Create a new branch.
3. Make your changes.
4. Submit a pull request.


## License

This project is licensed under the MIT License - see the LICENSE file for details.

