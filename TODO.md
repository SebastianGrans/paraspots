# TODOs

## Insert weather prognosis panel for the location? 

totle

Or maybe just show this if you hover over the yr button?
```
https://www.yr.no/nb/innhold/60.05388889,10.3225/meteogram.svg
```

Qt only implements SVG Tiny 1.2, so this doesn't work :(

## Add a list of all takeoffs to the right

~~The list should be searchable~~

If a location is available, then the distance from the location to the takeoff should be visible

Filter by location?

## If location can't be found, the user should be able to specify a location

Title (this is relevant later for the list of all takeoffs)


## Fix bug

Since I enabled ctrl+c to quit the app, I think that bypasses any "cleanup" activity that the app
needs to do before quitting (such as unregistering)

```bash
qt.qpa.services: Failed to register with host portal QDBusError("org.freedesktop.portal.Error.Failed", "Could not register app ID: Connection already associated with an application ID")
```

I asked the overlord, and they found:

```
Traced it down. Two pieces of evidence:

1. Where it comes from: the string "Failed to register with host portal" lives in QDesktopUnixServices::portalWindowIdentifier inside Qt's own libQt6Gui.so.6 — this is 100% internal Qt startup code, not anything in paraspots. Live-tracing the session D-Bus bus while the app started shows exactly one relevant call:


:1.1978 → org.freedesktop.portal.Desktop
  interface=org.freedesktop.host.portal.Registry; member=Register
  string "paraspots"
That's Qt automatically registering the app with the desktop portal once at startup — no app code runs this, and it only happens once per run, so it isn't a same-process double-registration bug.

2. It's not a leftover-state issue either: I ran the app completely fresh just now and it failed on that very first Register call — there's no earlier "paraspots" connection in this run for it to collide with. Combined with the fact this exact warning already showed up the very first time we ever ran the app this session (long before Ctrl+C/SIGINT was even in the picture), it rules out "a previous process didn't clean up" as the cause.

So: your Ctrl+C hypothesis doesn't hold — the SIGINT change is real (it does skip Python-level cleanup) but this specific error is Qt's own portal registration, decided entirely at startup, independent of how any previous run exited. This looks like an environment-level quirk in how xdg-desktop-portal is tracking connection identity here (plausibly related to running in a shared/unconfined sandbox context), not a bug in this codebase, and it's non-fatal — nothing in the app currently depends on portal dialogs. If the noise bothers you, it's fully suppressible without touching app code: QT_LOGGING_RULES="qt.qpa.services=false" uv run paraspots (confirmed it silences just this line). I'd leave it alone rather than "fix" it in the app.
```

My findings:

It disappears if I remove `app.setDesktopFileName("paraspots")` from `main.py` But that is needed
for positioning.

```bash
qt.positioning.geoclue2: Neither desktopId plugin parameter nor QGuiApplication::desktopFileName has been set. Please consider setting one of the two.
```

By instead specifying the `desktopId` in the `PositionSouce`, the `QDBusError` goes away.

Someone mentioned that the `QDBusError` goes away if there is a `.desktop` file.

https://discuss.kde.org/t/failed-to-register-with-host-portal-qdbuserror-org-freedesktop-portal-error-failed/43117/2

Anyhow. Not relevant for now.

Again, the AI:

```
Yes — likely worth keeping around for when the app is actually packaged/installed, but not needed right now.

QGuiApplication::desktopFileName() is how Qt ties the running process to its installed .desktop entry, and several things key off that match: correct taskbar/dock icon and window grouping (WM_CLASS-equivalent under Wayland), and — the portal-mediated features you're not using yet but might (native file dialogs, desktop notifications, screenshot grabbing) — those get attributed to the right app identity through it. Right now there's no paraspots.desktop file actually installed anywhere on this dev machine, so setting the name gives Qt an identity with nothing real behind it — which is plausibly exactly why the portal registration is misbehaving (it's registering a name that doesn't correspond to any known installed app).

So: once you package this (a .desktop file shipped via a deb/AppImage/Flatpak/whatever), reinstating setDesktopFileName("paraspots") matched to that real entry is the right move, and the portal registration should behave normally at that point since there'd be a legitimate entry backing it. Until then, dropping it and letting PositionSource's desktopId parameter carry the geoclue2 identification on its own costs you nothing — you're not currently using any of the other portal-gated features.
```

## Make search sort the results by relevance.

Searching for `sund` results in:

```
Vikersund hoppbakke
...
Sundvollen
```

It should prioritize sundvollen higher, since it starts with `sund`
