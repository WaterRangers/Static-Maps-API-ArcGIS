# Static Maps API - ArcGIS

This class allow you to add static images using a print service. By default ArcGIS Online **free service** is used but you can also add an ArcGIS Server service.

```javascript
require([
    "esriES/staticmap",
    "dojo/domReady!"
], function(StaticMap) {
    staticMap = new StaticMap();

    var options={
        basemap: "streets",
        zoom: 5,
        latitude: 40.432781,
        longitude: -3.626666,
        size: [400, 300],
        format: "JPG"
    };

    staticMap.getImage(options).then(function(imageURL){
        // Print the image
    });

});
```

Parameters:

Param| Type | Default value | Summary
--- | --- | --- | ---
basemap|string|topo|Allowed: satellite, topo, light-gray, dark-gray, streets, hybrid, oceans, national-geographic, osm
zoom|int|5|Allowed: from 1 to 15
latitude|double|40.432781|Allowed: -90 <= x >= 90
longitude|double|-3.626666|Allowed: 180 <r= x >= 180
size|array of int|[300,300]|Any
format|string|PNG32|Allowed: PDF, PNG32, PNG8, JPG, GIF, EPS, SVG, SVG2

## Configure dojoConfig

You need to configure dojoConfig like this:
```javascript
var dojoConfig = (function(){
    var base = location.href.split("/");
    base.pop();
    base = base.join("/");
    return {
        async: true,
        isDebug: true,
        packages:[{
            name: 'esriES', location: base + '/js'
        }]
    };
})();
```

In order to make it work. You can check the [demo](http://esri-es.github.io/Static-Maps-API-ArcGIS/) and [code here](https://github.com/esri-es/Static-Maps-API-ArcGIS/blob/master/index.html).

## Setup a different print service

If you want to use your own ArcGIS Server instance you can do it like this:

```javascript
require([
    "esriES/staticmap",
    "dojo/domReady!"
], function(StaticMap) {
    staticMap = new StaticMap({
        printService: "http://<your-domain>/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
    });
    ...
});
```
# Browser support

It should work at any browser, it uses Promises for Chrome, Firefox, Safari, etc and setTimeout for IE.
