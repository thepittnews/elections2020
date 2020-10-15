<!DOCTYPE html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <script src="http://code.jquery.com/jquery-3.5.1.min.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
    integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
    crossorigin=""/>
  <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"
    integrity="sha512-XQoYMqMTK8LvdxXYG3nZ448hOEQiglfqkJs1NOQV44cWnUrBc8PkAOcXy20w0vlaXaVUearIOBhiXZ5V3ynxwA=="
    crossorigin=""></script>

  <style>
    /*#map {
      height: 600px;
      width: 1000px;
    }*/

    body {
      padding: 0;
      margin: 0;
    }

    html, body, #map {
      height: 100%;
      width: 100vw;
    }
  </style>
</head>

<body>
  <div id="map"></div>

  <?php
    $csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTmwphY6oZEgjhGbyNKyFWI_VqDPBIyvLoYxIasPA7ZbwKup195iTyTm1aw8Gwcb1eLl0oOLkGexKXl/pub?gid=0&single=true&output=csv';
    $fileContents = file_get_contents($csvUrl);

    $lines = explode(PHP_EOL, $fileContents);
    $rows = array();
    foreach ($lines as $line) {
      $rows[] = str_getcsv($line);
    }
  ?>

  <script>
    const countyData = <?php echo json_encode($rows) ?>;
    const map = L.map('map', {
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
    map.setView([40.91, -77.8000], 7.8);

    $.getJSON('/geo_pa.geojson', (geoJSONData) => {
      for(var feature of geoJSONData.features) {
        const county = feature.properties["county_nam"];
        const countyDataRow = countyData.find((c) => c[0] === county);

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
  </script>
</body>
