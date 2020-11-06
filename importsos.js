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
    url: 'https://electionreturns.pa.gov/electionFeed.aspx?ID=29&FeedName=2020+General+Election+by+County',
    encoding: null
  })
  .then(parseXML)
  .then((parsedXML) => {
    return parsedXML.rss.channel[0].item.map((county) => {
      return new Promise((resolve) => {
        const $ = cheerio.load(county.description[0]);

        const precinctData = $('tr').eq(0).text().match(/ (\S+) Out of (\S+) Districts.*/);
        const bidenData = $($('tr').toArray().find((r) => $(r).text().includes('BIDEN')));
        const trumpData = $($('tr').toArray().find((r) => $(r).text().includes('TRUMP')));

        resolve({
          name: county.title[0].toUpperCase(),
          pctTotal: Number(precinctData[2].replace(',', '')),
          pctReporting: Number(precinctData[1].replace(',', '')),
          bidenPct: Number(bidenData.children('td').eq(7).text()),
          bidenVotes: Number(bidenData.children('td').eq(6).text().replace(',', '')),
          trumpPct: Number(trumpData.children('td').eq(7).text()),
          trumpVotes: Number(trumpData.children('td').eq(6).text().replace(',', '')),
        });
      });
    });
  })
  .then((p) => Promise.all(p));
};

const getToplineData = () => {
  return request({
    url: 'https://electionreturns.pa.gov/api/ElectionReturn/GET?methodName=GetSummaryData&electionid=83&electiontype=G&isactive=1',
  })
  .then((r) => {
    const statewide = JSON.parse(JSON.parse(r)).Election['President of the United States'][0].Statewide;

    return Promise.resolve([
      'ALL',
      '',
      '',
      statewide[0].Percentage,
      statewide[0].Votes,
      statewide[1].Percentage,
      statewide[1].Votes
    ]);
  });
};

Promise.all([getAuthClient(), getCountyData(), getToplineData()])
.then(([ authClient, countyData, toplineData ]) => {
  const add = (total, x) => total + x;
  let average = (array) => array.reduce((a, b) => a + b) / array.length;

  const sheetData = [
    ["name", "pctTotal", "pctReporting", "bidenPct", "bidenVotes", "trumpPct", "trumpVotes"],
    ...countyData.map(Object.values),
    toplineData
  ];

  return sheets.spreadsheets.values.update({
    auth: authClient,
    range: 'State!A1:G69',
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
