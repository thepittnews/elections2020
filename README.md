# elections2020

Collection of scripts to power coverage of the 2020 election from The Pitt News.

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

### Usage

Run `SPREADSHEET_ID=XX node importsos.js` to import the latest results
from the Pennsylvania Secretary of State website to a Google
spreadsheet.
