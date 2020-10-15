<!DOCTYPE html>
<head>
  <script src="https://d3js.org/d3.v5.min.js"></script><br />
  <link href="https://fonts.googleapis.com/css?family=Bebas+Neue|Oswald:200,300,400,500,600,700&display=swap" rel="stylesheet">
  <style>
    body {
      background-color: #c6e6f5;
    }

    .map {
      margin: auto;
      text-align: center;
    }

    .border {
      stroke-width: 1px;
    }

    @media screen and (max-width: 600px) {
      .map {
        width: 100%;
      }
    }

    @media screen and (min-width: 601px) {
      .map {
        width: 70%;
      }
    }
  </style>
</head>

<body>
  <div class="map"></div>

  <?php
    $csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTmwphY6oZEgjhGbyNKyFWI_VqDPBIyvLoYxIasPA7ZbwKup195iTyTm1aw8Gwcb1eLl0oOLkGexKXl/pub?gid=449653435&single=true&output=csv';
    $fileContents = file_get_contents($csvUrl);

    $lines = explode(PHP_EOL, $fileContents);
    $rows = array();
    foreach ($lines as $line) {
      $rows[] = str_getcsv($line);
    }
  ?>

  <script>
    function responsivefy(svg) {
      // Get container + svg aspect ratio
      var width = parseInt(svg.style("width")),
          height = parseInt(svg.style("height")),
          aspect = width / height;

      // Add viewBox and preserveAspectRatio properties,
      // and call resize so that svg resizes on inital page load
      svg.attr("viewBox", "0 0 " + width + " " + height)
        .attr("perserveAspectRatio", "xMinYMid")
        .call(resize);

      d3.select(window).on("resize." + container.attr("class"), resize);

      // Get width of container and resize svg to fit it
      function resize() {
        var targetWidth = parseInt(container.style("width"));
        svg.attr("width", targetWidth);
        svg.attr("height", Math.round(targetWidth / aspect));
      };
    };

    d3.selection.prototype.moveToFront = function() {
      return this.each(function() {
        this.parentNode.appendChild(this);
      });
    };

    const w = 1000;
    const h = 600;
    const container = d3.select("div.map");

    const svg = container.append("svg")
      .attr("width", w)
      .attr("height", h);
    responsivefy(svg);

    const countyData = <?php echo json_encode($rows) ?>;

    const democratColor = d3.scaleLog().domain([1, d3.max([100])])
      .interpolate(d3.interpolateRgb)
      .range([d3.rgb('#ceeafd'), d3.rgb('#006aab')]);

    const republicanColor = d3.scaleLog().domain([1, d3.max([100])])
      .interpolate(d3.interpolateRgb)
      .range([d3.rgb('#fbd0d0'), d3.rgb('#b02029')]);

    // Boot up graphic
    Promise.all([ d3.json("/geo_county.geojson"), d3.json("/geo_rivers.geojson") ])
    .then(function([ countyGeoData, riversGeoData ]) {
      for(var countyFeature of countyGeoData.features) {
        const municipality = countyFeature.properties.NAME;
        var countyDataRow = countyData.find((c) => c[0] === municipality);
        if (!countyDataRow) {
          countyDataRow = countyData.find((c) => c[0] === `${countyFeature.properties.NAME} ${countyFeature.properties.TYPE}`);
        }

        countyFeature.properties["pctTotal"] = countyDataRow[1];
        countyFeature.properties["pctReporting"] = countyDataRow[2];
        countyFeature.properties["bidenPct"] = countyDataRow[3];
        countyFeature.properties["bidenVotes"] = countyDataRow[4];
        countyFeature.properties["trumpPct"] = countyDataRow[5];
        countyFeature.properties["trumpVotes"] = countyDataRow[6];
      }

      const projection = d3.geoMercator();
      const path = d3.geoPath().projection(projection);
      projection.fitSize([w, h], countyGeoData); // Adjust the projection to the features

      const g = svg.append("g"); countyGeoData
      g.selectAll("path").data(countyGeoData.features.concat(riversGeoData.features))
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "border")
        .attr("stroke", "#000000")
        .attr("stroke-width", "1px")
        .attr("fill", function(d) {
          if (Number(d.properties["bidenVotes"].replace(',', '')) > Number(d.properties["trumpVotes"].replace(',', ''))) {
            return democratColor(d.properties["bidenPct"]);
          } else {
            return republicanColor(d.properties["trumpPct"]);
          }
        })
        .on("mouseover", function(d) {
          d3.select(this).attr("stroke", "#ffb81c").attr("stroke-width", "2px").moveToFront();
          d3.select("#county_hover").text(d.properties["county_nam"]);
          d3.select("#cases_hover").text(d3.format(",d")(d.properties["trumpPct"]));
        })
        .on("mouseout", function() {
          d3.select(this).attr("stroke", "#000000")
          d3.select("#county_hover").text("");
          d3.select("#cases_hover").text("");
        });
    });
  </script>
</body>
