# TODO Web

## Restore favorites

The user can have favs, but this is in localstorage, which is probably tied to the browser itself.
If the user then opens a different device, everything is gone.

It would be really cool if we some how could encode the favorites in a string, that we could have
the user enter, and decode into the favs

Discussed a rough approach with Claude - notes for when we actually plan this:

* No backend needed, pure client-side encode/decode.
* `country_id` is always small (currently just 160 for every takeoff) and `start_id` ranges 5-10934
  in the real data, so each favourite packs down to 3 raw bytes (1 byte country_id + 2 bytes
  start_id). Base64-encode the packed bytes (not the JSON) - roughly 40 chars for 10 favourites,
  ~80 for 20, ~200 for 50. Base64-encoding the raw JSON array instead would be about 4x longer for
  the same data.
* Prepend a version byte + a small checksum so a mistyped/corrupted code fails with a friendly
  error instead of silently importing garbage.
* Importing a code should *merge* with existing favourites, not replace them.
* UI-wise: export can reuse the existing clipboard-copy-with-fallback logic from the Share button;
  import is probably just a text input + button, maybe living in the info panel near the theme
  switcher.



## Remember last location

Maybe we should remember the last location/state the user was at so that next time the open the
website, they return to the same page?

## Clear localstorage?

Might be useful?

## Add an exit button to the info panel

You can exit it by just tapping outside the box, but also providing an (x) button cant hurt?

Or what is the best UX design?

## Add other maps options

??


## Add airspace info from https://luftrom.info/

They have a geojson and a xcontest.json file that can be used


## Add more to the information section

* You can double click on a takeoff to zoom to
  * You can also double click on an item in the list

What else have we implemented?

### Search bar tab supports

I should be able to tab to the sort-by, press enter, and then use key-up-down to switch between the
sorting options

Also in the python implementation!


## Deploy the python app for those who prefer a native app?

Title

## Add logging 

Does javascript even have a good loggin system?

## Code comments

Not a lot, but some guidance on what they are and why they are there


## Future plans

I recently built my IgcViewer app for viewing .igc files. What if we could combine that with this
app?

Drag n drop an igc file to see the flight (with cesium 3d view)

A flightlog plugin for uploading the flight


## [wontfix] Hide info panel 

After selecting a takeoff, it should also be possible to hide the panel and show the map fullscreen

Workaround: You can press "Map"

