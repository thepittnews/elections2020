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

      /* ** QUOTES ** */
      /*.show-quote {
        right: 0px !important;
        transition: right 1s ease-out, border-left 2s ease-in;
        border-left: 5px solid #5ca0c3 !important;
      }*/

      /*blockquote {
        font-family: 'Merriweather', serif;
        font-weight: 900;
        border-left: 5px solid white;

        float: right;
        max-width: 250px;
        font-weight: bold;
        padding: 13px;
        margin: 0 13px 13px 10px;
      }*/

      /* ** GENERAL CSS ** */
      .container a:hover {
        background-color: aliceblue;
        transition: background-color .5s linear;
      }

      p {
        font-family: 'Merriweather', serif;
        font-weight: 300;
      }

      /*p:first-child:first-letter {
        float: left;
        font-size: 75px;
        line-height: 60px;
        padding-top: 4px;
        padding-right: 8px;
        padding-left: 3px;
      }*/

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
    <script src="/map_county.js"></script>
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
        <div class="row">
          <div class="col m6 s12" style="text-align: center;">
            <h5>Allegheny County</h5>
            <div class="map-iframe" style="width: 100%; height: 300px;" id="county-map"></div>
          </div>

          <div class="col m6 s12" style="text-align: center;">
            <h5>Pennsylvania</h5>
            <iframe class-"map-iframe" width="100%" height="300px" src="/map_pa.php"></iframe>
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

      $.getJSON('https://pittnews.com/wp-json/wp/v2/posts/155561', (story) => {
        document.getElementById('story-container').innerHTML = story.content.rendered;
        $('div#story-container span').toArray().forEach((s) => $(s).removeAttr('style'));
      });

      <?php
        $csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTmwphY6oZEgjhGbyNKyFWI_VqDPBIyvLoYxIasPA7ZbwKup195iTyTm1aw8Gwcb1eLl0oOLkGexKXl/pub?gid=449653435&single=true&output=csv';
        $fileContents = file_get_contents($csvUrl);

        $lines = explode(PHP_EOL, $fileContents);
        $rows = array();
        foreach ($lines as $line) {
          $rows[] = str_getcsv($line);
        }
      ?>

      const countyData = <?php echo json_encode($rows) ?>;
      createCountyMap(countyData);
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