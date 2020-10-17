const createStateMap = (countyData) => {
  const map = L.map('state-map', {
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

  const setView = () => {
    const width = $('div#state-map').width();
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

  setView();
  $(window).on('resize', setView);

  $.getJSON('/geo_pa.geojson', (geoJSONData) => {
    for(var feature of geoJSONData.features) {
      const county = feature.properties["county_nam"];
      const countyDataRow = countyData.find((c) => c[0] === county);
      if (!countyDataRow) debugger;

      feature.properties["pctTotal"] = countyDataRow[1];
      feature.properties["pctReporting"] = countyDataRow[2];
      feature.properties["bidenPct"] = countyDataRow[3];
      feature.properties["bidenVotes"] = countyDataRow[4];
      feature.properties["trumpPct"] = countyDataRow[5];
      feature.properties["trumpVotes"] = countyDataRow[6];
    }

    const getFillColor = (feature) => {
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
            <h3>${feature.properties.county_nam} COUNTY</h3>
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
  });
};
