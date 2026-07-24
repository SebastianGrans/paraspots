# TODOs

## Add wind direction indicator

Done. But it's layout needs to be improved.

## Insert weather prognosis panel for the location? 

totle

## Add a list of all takeoffs to the right

~~The list should be searchable~~

If a location is available, then the distance from the location to the takeoff should be visible

Filter by location?

## If location can't be found, the user should be able to specify a location

Title (this is relevant later for the list of all takeoffs)

## Ctrl+w should quit the app

title

## Fix bug

Since I enabled ctrl+c to quit the app, I think that bypasses any "cleanup" activity that the app
needs to do before quitting (such as unregistering)

```bash
qt.qpa.services: Failed to register with host portal QDBusError("org.freedesktop.portal.Error.Failed", "Could not register app ID: Connection already associated with an application ID")
```

## Make search sort the results by relevance.

Searching for `sund` results in:

```
Vikersund hoppbakke
...
Sundvollen
```

It should prioritize sundvollen higher, since it starts with `sund`