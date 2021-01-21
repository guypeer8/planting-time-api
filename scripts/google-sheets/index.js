const fs = require('fs');
const readline = require('readline');
const { promisify } = require('util');
const { google } = require('googleapis');

const readFile = promisify(fs.readFile);

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

const TOKEN_PATH = 'gsheets_token.json';

const authorize = (file_name = 'g_credentials.json') => new Promise(async resolve => {
    const { client_secret, client_id, redirect_uris } = (await readFile(file_name)).installed;
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
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) {
                return console.error('Error while trying to retrieve access token', err);
            }
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) {
                    return console.error(err);
                }
                console.log('Token stored to', TOKEN_PATH);
            });
            resolve(oAuth2Client);
        });
    });
});

const listMajors = spreadsheetId => {
    const auth = await authorize();
    const sheets = google.sheets({ version: 'v4', auth });

    sheets.spreadsheets.values.get({ spreadsheetId }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
        const rows = res.data.values;
        if (rows.length) {
            console.log('Name, Major:');
            // Print columns A and E, which correspond to indices 0 and 4.
            rows.map(row => {
                console.log(`${row[0]}, ${row[4]}`);
            });
        } else {
            console.log('No data found.');
        }
    });
}

module.exports = {
  SCOPES,
  listMajors,
};