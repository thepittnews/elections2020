<?php
/**
* Template Name: Election 2020 results no map
*
 */
?>

<html>
  <head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.7/css/materialize.css">
    <script type="text/javascript" src="https://code.jquery.com/jquery-2.1.1.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/materialize/0.97.7/js/materialize.min.js"></script>
    <link href="https://fonts.googleapis.com/css?family=Merriweather:300,900+27px" rel="stylesheet">
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
        border-style: none;
      }
    </style>

    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
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
        <p class="center">Mail-in ballots must be postmarked by Nov. 3 at 8 p.m. and received by Nov. 6 by 5 p.m.</p>

        <h5>The latest from our news team:</h5>
        <div id="story-container"></div>
      </div>
    </div>
  </body>

  <script type="text/javascript">
    $(document).ready(function() {
      $('div[id*="attachment_"]').each((idx, el) => {
        const $el = $(el);
        $el.css({ width: '', 'max-width': '910px' });
      });

      $.getJSON('https://pittnews.com/wp-json/wp/v2/posts/161452?', (story) => {
        document.getElementById('story-container').innerHTML = story.content.rendered;
        $('div#story-container span').toArray().forEach((s) => $(s).removeAttr('style'));

        $('div#story-container strong').replaceWith(function() {
          return $('<b>').append($(this).html());
        });
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
