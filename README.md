# elections2020

Collection of scripts to power coverage of the 2020 election from The Pitt News.

### Concept of operations

- Data from PA. SOS --> Ingest via `importsos.js` --> Posted to Google
spreadsheet --> Displayed through maps or other data visualizations

- Data from County Elections --> Ingest via `importcounty.js` --> Posted to Google
spreadsheet --> Displayed through maps or other data visualizations

### Setup

Create a Google OAuth app, and then `credentials.json` with the following format:

```json
{
  "client_id": "",
  "client_secret": "",
  "redirect_uris": [
    ""
  ]
}

```

### Usage: County

- Run `SPREADSHEET_ID=XX node importcounty.js` to import the latest results
from the Allegheny County Division of Elections website to a Google spreadsheet.

- Use `map_county.php` to display the generated map.

### Usage: State

- Run `SPREADSHEET_ID=XX node importsos.js` to import the latest results
from the Pennsylvania Secretary of State website to a Google
spreadsheet.

- Use `map_pa.php` to display the generated map.
