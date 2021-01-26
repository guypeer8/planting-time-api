require('dotenv').config();

const fs = require('fs');
const { join } = require('path');
const csv = require('csvtojson/v2');
const readline = require('readline');
const { promisify } = require('util');
const { google } = require('googleapis');
const groupBy = require('lodash/groupBy');

const readFile = promisify(fs.readFile);

const creds = require(join(__dirname, './g_credentials.json'));

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

const TOKEN_PATH = join(__dirname, 'gsheets_token.json');

const authorize = () => new Promise(async resolve => {
    const { client_secret, client_id, redirect_uris } = creds.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    try {
        const token = await readFile(TOKEN_PATH);
        oAuth2Client.setCredentials(JSON.parse(token));
        resolve(oAuth2Client);
    } catch(e) {
        resolve(getNewToken(oAuth2Client))
    }
});

const getNewToken = oAuth2Client => new Promise(resolve => {
    const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Enter the code from that page here: ', code => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) {
                return console.error('Error while trying to retrieve access token', err);
            }
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
                if (err) { return console.error(err); }
                console.log('Token stored to', TOKEN_PATH);
            });
            resolve(oAuth2Client);
        });
    });
});

const getSpreadSheet = spreadsheetId => new Promise(async (resolve, reject) => {
    const auth = await authorize();
    const sheets = google.sheets({ version: 'v4', auth });
    sheets.spreadsheets.values.get({ spreadsheetId }, (err, res) => {
        if (err) { return reject(err); }
        resolve(get(res, 'data.values', []));
    });
});

const getPlants = async spreadsheetId => {
    const plant_rows = await getSpreadSheet(spreadsheetId);
    console.warn('plant_rows:', plant_rows);
};

(async () => {
    // const p = await getSpreadSheet('1ZTDpTlGV1scf80AaRZctczpN0gBGr5U4KIdYoZ2H9OQ');
    // console.log(p);
    const data = groupBy(await csv().fromFile(join(__dirname, 'plants.csv')), 'field1');
    console.log(data)
})();

module.exports = {
    getPlants,
};