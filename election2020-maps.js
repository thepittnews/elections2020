const createResultsMap = (containerID, reportingUnitIdentifier, mapCb) => {
  const map = L.map(containerID, {
    doubleClickZoom: false,
    scrollWheelZoom: false,
    touchZoom: false,
    zoomControl: false,
    zoomSnap: 0.1
  });

  const tilelayer = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  let setView;
  if (reportingUnitIdentifier === 'NAME') {
    setView = () => {
      const width = $(`div#${containerID}`).width();
      if (width >= 640) {
        map.setView([40.4350, -79.9959], 10.3);
      } else if (width >= 500) {
        map.setView([40.4350, -80.025], 10);
      } else {
        map.setView([40.4350, -80.025], 9.3);
      }
    };
  } else {
    setView = () => {
      const width = $(`div#${containerID}`).width();
      if (width >= 975) {
        map.setView([40.97, -77.8], 7.8);
      } else if (width >= 640) {
        map.setView([40.95, -77.7], 7.2);
      } else if (width >= 470) {
        map.setView([40.97, -77.7], 6.8);
      } else {
        map.setView([40.97, -77.7], 6.6);
      }
    };
  }

  setView();
  $(window).on('resize', setView);

  mapCb(map);
};

const drawResultsMap = (map, geoJSONUrl, reportingUnitIdentifier, resultData, cb) => {
  $.getJSON(geoJSONUrl, (geoJSONData) => {
    for(var feature of geoJSONData.features) {
      const reportingUnit = feature.properties[reportingUnitIdentifier];

      if (!reportingUnit.endsWith(' River') && reportingUnit != " ") {
        var dataRow = resultData.find((c) => c[0] === reportingUnit);
        if (!dataRow && reportingUnitIdentifier === 'NAME') {
          dataRow = resultData.find((c) => c[0] === `${feature.properties.NAME} ${feature.properties.TYPE}`);
        }

        feature.properties["pctTotal"] = dataRow[1];
        feature.properties["pctReporting"] = dataRow[2];
        feature.properties["bidenPct"] = dataRow[3];
        feature.properties["bidenVotes"] = dataRow[4];
        feature.properties["trumpPct"] = dataRow[5];
        feature.properties["trumpVotes"] = dataRow[6];
      }
    }

    const getFillColor = (feature) => {
      if (feature.properties.NAME) {
        if (feature.properties.NAME.endsWith(' River') || feature.properties.NAME === " ") {
          return '#000000';
        }
      }

      if (Number(feature.properties.bidenVotes.replace(',', '')) > Number(feature.properties.trumpVotes.replace(',', ''))) {
        return Number(feature.properties.bidenPct) > 70 ? '#006aab' :
               Number(feature.properties.bidenPct) > 60 ? '#6193c7' :
               Number(feature.properties.bidenPct) > 50 ? '#9cc0e3' : '#ceeafd';
      } else {
        return Number(feature.properties.trumpPct) > 70 ? '#b02029' :
               Number(feature.properties.trumpPct) > 60 ? '#cf635d' :
               Number(feature.properties.trumpPct) > 50 ? '#e99d98' : '#fbd0d0';
      }
    };

    const style = (feature) => {
      return {
        color: '#000000',
        fillColor: getFillColor(feature),
        fillOpacity: 0.8
      };
    }

    const geoJSON = L.geoJSON(geoJSONData, {
      onEachFeature: (feature, layer) => {
        layer.on('mouseover', function () {
          const tooltipText = `<div>
            <h6>${feature.properties[reportingUnitIdentifier]} ${reportingUnitIdentifier === 'county_nam' ? 'COUNTY' : ''}</h6>
            <p>Biden Votes: ${numberWithCommas(feature.properties.bidenVotes)}, Pct: ${feature.properties.bidenPct}</p>
            <p>Trump Votes: ${numberWithCommas(feature.properties.trumpVotes)}, Pct: ${feature.properties.trumpPct}</p>
          </div>`;
          //<p>${feature.properties.pctReporting} of ${feature.properties.pctTotal} in-person precincts reporting</p>
          layer.bindTooltip(tooltipText).openTooltip();

          this.setStyle({ color: '#ffb81c' });

          if (!L.Browser.ie && !L.Browser.opera) {
            this.bringToFront();
          }
        });

        layer.on('mouseout', function () {
          this.setStyle({ color: '#000000' });
        });
      },
      style
    }).addTo(map);

    cb(geoJSON);
  });
};

const initializeMapConfig = () => {
  mapConfigs.forEach((config) => {
    const drawAndUpdateMap = (resultsData) => {
      drawResultsMap(config.mapEl, config.geoJSONUrl, config.reportingUnitIdentifier, resultsData, (layer) => {
        config.geoLayer = layer;
      });
      updateResultsSummary(config.code, resultsData);
    };

    const fetchAndUpdateMap = (createMap) => {
      if (config.geoLayer) config.mapEl.removeLayer(config.geoLayer);

      $.getJSON({ url: `/election-2020-staging-data?map=${config.code}` }, (resultsData) => {
        if (createMap) {
          createResultsMap(`${config.code}-map`, config.reportingUnitIdentifier, (map) => {
            config.mapEl = map;
            drawAndUpdateMap(resultsData);
          });
        } else {
          drawAndUpdateMap(resultsData);
        }
      });
    };

    fetchAndUpdateMap(true);
    setInterval(() => fetchAndUpdateMap(false), 60000);
  });
};

const mapConfigs = [
  {
    code: 'county',
    geoJSONUrl: '/geo_combo.geojson',
    geoLayer: null,
    map: null,
    reportingUnitIdentifier: 'NAME',
  },
  {
    code: 'state',
    geoJSONUrl: '/geo_pa.geojson',
    geoLayer: null,
    map: null,
    reportingUnitIdentifier: 'county_nam'
  }
];

const numberWithCommas = (x) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const updateResultsSummary = (code, resultsData) => {
  resultsData.shift();
  resultsData.unshift();

  const statewideData = resultsData[resultsData.length - 1];
  const bidenPct = Number(statewideData[3]);
  const bidenVotes = statewideData[4];
  const trumpPct = Number(statewideData[5]);
  const trumpVotes = statewideData[6];

  if (bidenPct > trumpPct) {
    $(`p#${code}-race-summary`).html(`Biden leads Trump ${bidenPct}% to ${trumpPct}%,<br>or ${numberWithCommas(bidenVotes)} votes to ${numberWithCommas(trumpVotes)} votes.`);
  } else {
    $(`p#${code}-race-summary`).html(`Trump leads Biden ${trumpPct}% to ${bidenPct}%,<br>or ${numberWithCommas(trumpVotes)} votes to ${numberWithCommas(bidenVotes)} votes.`);
  }

  const pctTotal = resultsData.map((rd) => Number(rd[1])).reduce((total, x) => total + x, 0);
  const pctReport = resultsData.map((rd) => Number(rd[2])).reduce((total, x) => total + x, 0);
  const pctReportPct = (100 * (pctReport / pctTotal)).toFixed(2);
  //$(`p#${code}-precinct-summary`).html(`${pctReport} of ${pctTotal} (${pctReportPct}%) in-person precincts reporting`);
};
