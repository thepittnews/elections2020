const cheerio = require('cheerio');
const { google } = require('googleapis');
const sheets = google.sheets('v4');
const parseXML = require('util').promisify(require('xml2js').parseString);
const readline = require('readline');
const request = require('request-promise');
const { readFile, writeFile } = require('fs').promises;

const nameMap = {
  'BALDWIN BR': 'BALDWIN BOROUGH',
  'BALDWIN TP': 'BALDWIN TOWNSHIP',
  'BEN AVON HT': 'BEN AVON HEIGHTS',
  'BRADDOCK HL': 'BRADDOCK HILLS',
  'CASL SHANNON': 'CASTLE SHANNON',
  'E MCKEESPORT': 'EAST MCKEESPORT',
  'E PITTSBURGH': 'EAST PITTSBURGH',
  'ELIZABETH BR': 'ELIZABETH BOROUGH',
  'ELIZABETH TP': 'ELIZABETH TOWNSHIP',
  'FRANKLIN PK': 'FRANKLIN PARK',
  'JEFFERSON HL': 'JEFFERSON HILLS',
  'MT OLIVER': 'MOUNT OLIVER',
  'MT LEBANON': 'MOUNT LEBANON',
  'N BRADDOCK': 'NORTH BRADDOCK',
  'N FAYETTE': 'NORTH FAYETTE',
  'N VERSAILLES': 'NORTH VERSAILLES',
  "OHARA": "O'HARA",
  'PENNSBURY VILL': 'PENNSBURY VILLAGE',
  'PLEASANT HL': 'PLEASANT HILLS',
  'S FAYETTE': 'SOUTH FAYETTE',
  'S VERSAILLES': 'SOUTH VERSAILLES',
  'SPRINGDAL BR': 'SPRINGDALE BOROUGH',
  'SPRINGDALE TWP': 'SPRINGDALE TOWNSHIP',
  'SEWICKLEY HTS': 'SEWICKLEY HEIGHTS',
  'UP ST CLAIR': 'UPPER ST. CLAIR',
  'UPPER SAINT CLAIR': 'UPPER ST. CLAIR',
  'W ELIZABETH': 'WEST ELIZABETH',
  'W HOMESTEAD': 'WEST HOMESTEAD',
};

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
  return Promise.all([
    request({
      url: 'https://results.enr.clarityelections.com//PA/Allegheny/106267/272321/json/ALL.json',
      json: true
    }),

    readFile('geo_combo.geojson')
    .then((f) => {
      return Promise.resolve(
        JSON.parse(f).features.concat({ properties: { LABEL: '-1', NAME: '-1' } })
        .map((f) => {
          if (f.properties.LABEL === "Baldwin Borough") return 'BALDWIN BR';
          if (f.properties.LABEL === "Baldwin Township") return 'BALDWIN TP';
          if (f.properties.LABEL === 'Elizabeth Borough') return 'ELIZABETH BR';
          if (f.properties.LABEL === 'Elizabeth Township') return 'ELIZABETH TP';
          if (f.properties.LABEL === 'Springdale Borough') return 'SPRINGDAL BR';
          if (f.properties.LABEL === 'Springdale Township') return 'SPRINGDALE TWP';
          return f.properties.NAME;
        })
        .filter((name) => !name.includes('River') && !/^\s*$/.test(name))
        .map((name) => {
          return {
            name: nameMap[name] || name,
            pctTotal: 0,
            pctReporting: 0,
            bidenPct: 0,
            bidenVotes: 0,
            trumpPct: 0,
            trumpVotes: 0,
            totalVotes: 0,
            reportingUnits: 0,
          };
        }));
    })
  ])
  .then(([countyData, municipalities]) => {
    const add = (total, num) => total + num;

    countyData.Contests.forEach((municipality) => {
      const municipalityDataStore = municipalities.find((m) => {
        var name = municipality.A;
        if (name.includes(' WARD')) name = name.split(' WARD')[0];
        if (name.includes(' DIST')) name = name.split(' DIST')[0];

        if (nameMap[name]) return m.name === nameMap[name];
        return m.name === name;
      });
    });

    const precincts = countyData.Contests.map((municipality) => {
      const municipalityDataStore = municipalities.find((m) => {
        var name = municipality.A;
        if (name.includes(' WARD')) name = name.split(' WARD')[0];
        if (name.includes(' DIST')) name = name.split(' DIST')[0];

        if (nameMap[name]) return m.name === nameMap[name];
        return m.name === name;
      });

      if (!municipalityDataStore) {
        console.log(municipality.A);
        return Promise.resolve();
      }

      if (municipality.V[0]) {
        municipalityDataStore.reportingUnits++;
        municipalityDataStore.bidenVotes += municipality.V[0][0];
        municipalityDataStore.trumpVotes += municipality.V[0][1];
        municipalityDataStore.totalVotes += municipality.V[0].reduce(add);
      }

      return Promise.resolve();
    });

    return Promise.all(precincts)
    .then(() => Promise.resolve(municipalities));
  });
};

Promise.all([getAuthClient(), getCountyData()])
.then(([ authClient, countyData ]) => {
  const sheetData = [
    ["name", "pctTotal", "pctReporting", "bidenPct", "bidenVotes", "trumpPct", "trumpVotes"],
    ...countyData.map((municipality) => {
      const bidenPct = Math.ceil((municipality.bidenVotes / municipality.totalVotes) * 10000) / 100;
      const trumpPct = Math.ceil((municipality.trumpVotes / municipality.totalVotes) * 10000) / 100;

      return [
        municipality.name,
        municipality.reportingUnits,
        municipality.reportingUnits,
        bidenPct,
        municipality.bidenVotes,
        trumpPct,
        municipality.trumpVotes,
      ];
    })
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
