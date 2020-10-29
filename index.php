<html>
  <head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.7/css/materialize.css">
    <script type="text/javascript" src="https://code.jquery.com/jquery-2.1.1.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.7/js/materialize.min.js"></script>
    <link href="https://fonts.googleapis.com/css?family=Merriweather:300,900|Oswald:300,400|Slabo+27px" rel="stylesheet">
    <script async src="https://www.googletagmanager.com/gtag/js?id=UA-66952241-1"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'UA-66952241-1');
    </script>
    <title>The Pitt News</title>

    <style>
      body { overflow-x: hidden; }

      /* ** TITLES and HEADER ** */
      #story-title, #header-title {
        font-weight: 900;
        font-family: 'Merriweather', serif;
      }

      #story-title {
        text-align: center;
        color: black;
      }

      #header-title {
        margin-left: auto;
        margin-right: auto;
        float: right;
        padding-right: 20px;
        opacity: 0;
        transition: all 1s linear;
        color: white;
      }

      .show-title {
        opacity: 1 !important;
        transition: all 1s linear;
      }

      nav {
        background-color: #212121 !important;
        opacity: 0.8;
      }

      .brand-logo {
        height: 40px;
        margin-top: 10px;
        margin-left: 10px;
      }

      .author-info, #date-info {
        font-family: 'Oswald', sans-serif;
        font-size: 20px;
      }

      #date-info {
        font-weight: 300;
        font-size: 18px;
      }

      /* ** GENERAL CSS ** */
      .container a:hover {
        background-color: aliceblue;
        transition: background-color .5s linear;
      }

      p {
        font-family: 'Merriweather', serif;
        font-weight: 300;
      }

      .wp-caption-text { font-style: italic; }
      img.size-large { height: auto; width: 100% }

      /* ** MEDIA ** */
      @media(max-width: 993px) {
        #header-title { display: none; }
      }

			.navbar-fixed {
				position: fixed;
				top: 0px;
			}

      .post-navbar-container {
        padding-top: 60px;
      }

      @media only screen and (min-width: 601px) {
        .post-navbar-container {
          padding-top: 70px;
        }
      }

      .map-iframe {
        display: block;
        border-style:none;
      }
    </style>

    <!-- Map assets -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <script src="http://code.jquery.com/jquery-3.5.1.min.js"></script>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
      integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
      crossorigin=""/>
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"
      integrity="sha512-XQoYMqMTK8LvdxXYG3nZ448hOEQiglfqkJs1NOQV44cWnUrBc8PkAOcXy20w0vlaXaVUearIOBhiXZ5V3ynxwA=="
      crossorigin=""></script>
    <script src="/maps.js"></script>
  </head>

  <body>
    <div class="navbar-fixed">
      <nav>
        &nbsp;
        <a href="https://pittnews.com"><img class="brand-logo" src="https://pittnews.com/wp-content/uploads/2018/03/TPN-VECTOR-BLUE-small.png" /></a>
        <span id="header-title">Election 2020 Results</span>
      </nav>
    </div>

    <div class="post-navbar-container">
      <div class="container">
        <h4 id="story-title">Election 2020 Results</h4>
        <p class="center">Polls close at 8 p.m.; mail-in ballots must be postmarked on or by Nov. 3</p>

        <div class="row">
          <div class="col m6 s12 center">
            <h5>Allegheny County</h5>
            <p id="county-race-summary"></p>
            <p id="county-precinct-summary"></p>
            <div class="map-iframe" style="width: 100%; height: 300px;" id="county-map"></div>
          </div>

          <div class="col m6 s12 center">
            <h5>Pennsylvania</h5>
            <p id="state-race-summary"></p>
            <p id="state-precinct-summary"></p>
            <div class="map-iframe" style="width: 100%; height: 300px;" id="state-map"></div>
          </div>
        </div>

        <h5>The latest from our news team:</h5>
        <div id="story-container"></div>

        <!--<span class="author-info">-->
          <!--Written by <a style='color: inherit; text-decoration: underline;' href='https://pittnews.com/staff/?writer=The Pitt News Staff'>The Pitt News Staff</a>-->
        <!--</span>-->
      </div>
    </div>
  </body>

  <script type="text/javascript">
    $(document).ready(function() {
      $('div[id*="attachment_"]').each((idx, el) => {
        const $el = $(el);
        $el.css({ width: '', 'max-width': '910px' });
      });

      $.getJSON('https://pittnews.com/wp-json/wp/v2/posts/161452', (story) => {
        document.getElementById('story-container').innerHTML = story.content.rendered;
        $('div#story-container span').toArray().forEach((s) => $(s).removeAttr('style'));

        $('div#story-container strong').replaceWith(function() {
          return $('<b>').append($(this).html());
        });
      });


      var mapConfigs = [
        {
          code: 'county',
          geoJSONUrl: 'geo_combo.geojson',
          geoLayer: null,
          map: null,
          reportingUnitIdentifier: 'NAME',
        },
        {
          code: 'state',
          geoJSONUrl: 'geo_pa.geojson',
          geoLayer: null,
          map: null,
          reportingUnitIdentifier: 'county_nam'
        }
      ];

      const updateResultsSummary = (code, resultsData) => {
        resultsData.shift();
        resultsData.unshift();

        const bidenPct = 60;
        const bidenVotes = 60000;
        const trumpPct = 40;
        const trumpVotes = 40000;

        $(`p#${code}-race-summary`).html(`Biden leads Trump ${bidenPct}% to ${trumpPct}%,<br>or ${bidenVotes} votes to ${trumpVotes} votes.`);

        const pctTotal = resultsData.map((rd) => Number(rd[1])).reduce((total, x) => total + x, 0);
        const pctReport = resultsData.map((rd) => Number(rd[2])).reduce((total, x) => total + x, 0);
        const pctReportPct = (100 * (pctReport / pctTotal)).toFixed(2);
        $(`p#${code}-precinct-summary`).html(`${pctReport} of ${pctTotal} (${pctReportPct}%) in-person precincts reporting`);
      };


      mapConfigs.forEach((config) => {
        $.getJSON({ url: `/getdata.php?map=${config.code}` }, (resultsData) => {
          createResultsMap(`${config.code}-map`, config.reportingUnitIdentifier, (map) => {
            config.mapEl = map;
            drawResultsMap(config.mapEl, config.geoJSONUrl, config.reportingUnitIdentifier, resultsData, (layer) => {
              config.geoLayer = layer;
            });
            updateResultsSummary(config.code, resultsData);
          });
        });

        setInterval(() => {
          if (config.geoLayer) config.mapEl.removeLayer(config.geoLayer);

          $.getJSON({ url: `/getdata.php?map=${config.code}` }, (resultsData) => {
            drawResultsMap(config.mapEl, config.geoJSONUrl, config.reportingUnitIdentifier, resultsData, (layer) => {
              config.geoLayer = layer;
            });
            updateResultsSummary(config.code, resultsData);
          });
        }, 60000);
      });
    });

    $(window).scroll(function() {
      const scrollTop = $(window).scrollTop();
      if (scrollTop > 300) {
        $("#header-title").addClass('show-title');
      } else {
        $('#header-title').removeClass('show-title');
      }
    });
  </script>
</html>
