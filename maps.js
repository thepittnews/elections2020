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
            <p>Biden Votes: ${feature.properties.bidenVotes}, Pct: ${feature.properties.bidenPct}</p>
            <p>Trump Votes: ${feature.properties.trumpVotes}, Pct: ${feature.properties.trumpPct}</p>
            <p>${feature.properties.pctReporting} of ${feature.properties.pctTotal} in-person precincts reporting</p>
          </div>`;
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
