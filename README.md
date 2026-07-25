# ParaSpots

A map of paragliding and hang gliding takeoff spots, built for planning trips to unfamiliar areas.

**[sebastiangrans.github.io/paraspots](https://sebastiangrans.github.io/paraspots/)**

## Why

When traveling, it's hard to get a quick overview of where you can fly in a new area.
[flightlog.org](https://flightlog.org) has the most complete takeoff database but no map, no links
to Google Maps, and no links to weather at the site. `paraglidingmap.com` has a map but doesn't
necessarily cover every spot. Neither shows takeoff wind directions or a forecast at a glance.

ParaSpots is a single page to find takeoffs in a region, see which wind directions each one works
for, and view the forecast without having to leave the site!

Currently it includes every takeoff (in Norway) on flightlog.org with a registered flight in the
past 3 years.

## Native application

This project started out as a Python Qt application, but I realized that I would prefer to have
this more easily available.

For those interested in a native application, it can be installed and run with:

```bash
pip install "git+https://github.com/SebastianGrans/paraspots.git#subdirectory=py"
paraspots
```


## Attribution

The data for each takeoff location was scraped from [flightlog.org](). Its shortcomings is the
whole reason this project exists, but it also wouldn't have been possible without it!

## Disclosure of AI use

Large parts of this project, including both the desktop app and the web port, were written using an
LLM. It was used interactively: one feature at a time, and I've tried my best to review the code.

## License

MIT — see [LICENSE](LICENSE).
