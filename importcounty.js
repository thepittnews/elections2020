const cheerio = require('cheerio');
const { google } = require('googleapis');
const sheets = google.sheets('v4');
const parseXML = require('util').promisify(require('xml2js').parseString);
const readline = require('readline');
const request = require('request-promise');
const { readFile, writeFile } = require('fs').promises;

const getAuthClient = () => {
  return readFile('./credentials.json')
  .then((contents) => {
    const credentials = JSON.parse(contents.toString());
    const { client_id, client_secret, redirect_uris } = credentials;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if there is a previously stored token
    return readFile('./token.json')
    .then((token) => {
      oAuth2Client.setCredentials(JSON.parse(token));
      return Promise.resolve(oAuth2Client);
    })
    .catch((e) => {
      return new Promise((resolve, reject) => {
        const authUrl = oAuth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        console.log('Authorize this app by visiting this url:', authUrl);

        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        rl.question('Enter the code from that page here: ', (code) => {
          rl.close();

          oAuth2Client.getToken(code, (_, token) => {
            oAuth2Client.setCredentials(token);

            writeFile('./token.json', JSON.stringify(token))
            .then(() => resolve(oAuth2Client));
          });
        });
      });
    });
  });
};

const getCountyData = () => {
  return request({
    url: 'https://results.enr.clarityelections.com//PA/Allegheny/103291/254824/json/ALL_district.json',
    json: true
  })
  .then((countyData) => {
    const add = (total, num) => total + num;
    const nameMap = {
      'MT OLIVER': 'MOUNT OLIVER',
      'MT LEBANON': 'MOUNT LEBANON',
      'UPPER SAINT CLAIR': 'UPPER ST. CLAIR',
      "OHARA": "O'HARA"
    };

    return countyData.Districts.map((municipality) => {
      const bidenVotes = municipality.Contests.map((c) => c.V[0] ? c.V[0][1] : 0).reduce(add);
      const trumpVotes = municipality.Contests.map((c) => c.V[0] ? c.V[0][0] : 0).reduce(add);
      const totalVotes = municipality.Contests.map((c) => c.V[0]).flat().reduce(add);

      return Promise.resolve({
        name: nameMap[municipality.Name] || municipality.Name,
        pctTotal: municipality.TotalNumberPrecincts,
        pctReporting: municipality.PrecinctReporting,
        bidenPct: totalVotes > 0 ? Math.ceil((bidenVotes / totalVotes) * 10000) / 100 : 0,
        bidenVotes,
        trumpPct: totalVotes > 0 ? Math.ceil((trumpVotes / totalVotes) * 10000) / 100 : 0,
        trumpVotes
      });
    });
  })
  .then((p) => Promise.all(p));
};

Promise.all([getAuthClient(), getCountyData()])
.then(([ authClient, countyData ]) => {
  const sheetData = [
    ["name", "pctTotal", "pctReporting", "bidenPct", "bidenVotes", "trumpPct", "trumpVotes"],
    ...countyData.map(Object.values)
  ];

  return sheets.spreadsheets.values.update({
    auth: authClient,
    range: 'County!A1:G132',
    resource: {
      values: sheetData,
    },
    spreadsheetId: process.env.SPREADSHEET_ID,
    valueInputOption: 'USER_ENTERED',
  });
})
.then((response) => {
  if (response.status === 200) {
    console.log(`***DONE: ${(new Date()).toLocaleString()}`);
  }
})
.catch(console.log);
