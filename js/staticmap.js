define([
        "dojo/_base/declare",
        "esri/config",
        "esri/geometry/webMercatorUtils",
        "esri/request",
        "dojo/Deferred",
        "esri/symbols/PictureMarkerSymbol"
    ],
    function(declare, esriConfig, webMercatorUtils, esriRequest, Deferred, PictureMarkerSymbol) {
        return declare(null, {

            constructor: function(options){
                options = options || {};

                this.printService = options.printService || "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"; // default seat geek range is 30mi

                esriConfig.defaults.io.corsEnabledServers.push("sampleserver6.arcgisonline.com");

                that = this;
            },

            getXY: function(options){

                var xy, location, deferred,
                    geocoderService = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates";

                if(options.longitude && options.latitude) {
                    deferred = new Deferred();
                    xy = webMercatorUtils.lngLatToXY(options.longitude, options.latitude);
                    deferred.resolve(xy);
                    return deferred.promise;

                }else if(options.address){
                    deferred = new Deferred();
                    esriRequest({
                        "url": geocoderService,
                        "content": {
                            SingleLine: options.address,
                            f: "json",
                            outSR: '{"wkid":102100}',
                            outFields: "Match_addr",
                            Addr_type: "StAddr,City",
                            maxLocations:1
                        }
                    }).then(function(response, io){
                        location = response.candidates[0].location;
                        xy = [location.x, location.y];
                        deferred.resolve(xy);
                    }, function(error, io){
                        return error;
                    });

                    return deferred.promise;

                }else{
                    deferred = new Deferred();
                    xy = webMercatorUtils.lngLatToXY(-3.626666, 40.432781);
                    deferred.resolve(xy);
                    return deferred.promise;
                }
            },

            getImage: function(options) {
                var extentValue, xy, z, extents, webmap, format, layoutTemplate, f, params, request;
                var deferred = new Deferred();

                options = options || {};

                this.getXY(options).then(function(response){
                    var deferred;
                    xy = response;

                    extents = [100, 200, 300, 400, 500, 1000,10000,24000,100000,250000,500000,750000,1000000,3000000,10000000];
                    extentValue = extents[2];
                    z = options.zoom || 5;

                    if(typeof(z)==="number" && (z>0 && z < extents.length)){
                        extentValue = extents[z-1];
                    }

                    webmap = options.webmap || that.getDefaultWebmap(xy,extentValue);

                    if(options.markers){
                        webmap.operationalLayers.push(that.addMarkers(options.markers));
                    }

                    if(options.size){
                        webmap.exportOptions.outputSize = options.size;
                    }

                    webmap.operationalLayers[0].url = that.getBasemapService(options);
                    format = options.format || "PNG32";
                    layoutTemplate = options.layoutTemplate || "MAP_ONLY";
                    f = options.f || "json";

                    params = {
                        f: f,
                        format: format,
                        Layout_Template: layoutTemplate,
                        Web_Map_as_JSON: JSON.stringify(webmap)
                    };

                    deferred = new Deferred();
                    request = new XMLHttpRequest();
                    request.onreadystatechange = function()
                    {
                        if (request.readyState == 4 && request.status == 200)
                        {
                            obj = JSON.parse(request.responseText);
                            deferred.resolve(obj.results[0].value.url);
                        }
                    };
                    request.open("POST", that.printService+'/execute', true);
                    request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
                    request.send(that.parseParams(params));
                    return deferred.promise;

                }).then(function(response){
                    deferred.resolve(response)
                });
                return deferred.promise;

            },

            parseParams: function(obj){
                var pairs = [];

                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        var k = encodeURIComponent(prop),
                            v = encodeURIComponent(obj[prop]);
                        pairs.push( k + "=" + v);
                    }
                }
                return pairs.join("&");
            },


            getBasemapService: function(options){
                switch(options.basemap){
                    case 'satellite':
                        return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer";
                    case 'topo':
                        return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer";
                    case 'light-gray':
                        return "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer";
                    case 'dark-gray':
                        return "https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer";
                    case 'streets':
                        return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer";
                    case 'hybrid':
                        return "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer";
                    case 'oceans':
                        return "https://server.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Reference/MapServer";
                    case 'national-geographic':
                        return "https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer";
                    case 'osm':
                        return "https://a.tile.openstreetmap.org/";
                    default:
                        return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer";
                }
            },

            getDefaultWebmap: function(xy,extentValue){
                return {
                    "mapOptions": {
                        "showAttribution": false,
                        "extent": {
                            "xmin": xy[0] - extentValue,
                            "ymin": xy[1] - extentValue,
                            "xmax": xy[0] + extentValue,
                            "ymax": xy[1] + extentValue,
                            "spatialReference": {
                                "wkid": 102100,
                                "latestWkid": 3857
                            }
                        },
                        "spatialReference": {
                            "wkid": 102100,
                            "latestWkid": 3857
                        }
                    },
                    "operationalLayers": [
                        {
                            "id": "Ocean",
                            "title": "Ocean",
                            "opacity": 1,
                            "url": "https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer"
                        }
                    ],
                    "exportOptions": {
                        "outputSize": [
                            300,
                            300
                        ],
                        "dpi": 144
                    }
                }
            },
            /*
            TODO: be able to load any image
            convertImgToBase64URL: function(url, callback, outputFormat){
                var img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = function(){
                    var canvas = document.createElement('CANVAS'),
                        ctx = canvas.getContext('2d'), dataURL;
                    canvas.height = this.height;
                    canvas.width = this.width;
                    ctx.drawImage(this, 0, 0);
                    var dataURL = canvas.toDataURL(outputFormat || 'image/png');
                    callback(dataURL);
                    canvas = null;
                };
                img.src = url;
            },
            */

            base64Icon: function(color) {
                switch (color) {
                    case "green":
                        return {
                            type:"image/png",
                            imageData: "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"
                        };
                }


            },

            addMarkers: function(markers){
                var i, symbol;
                var layer = {
                    "id": "map_graphics",
                    "opacity": 1,
                    "minScale": 0,
                    "maxScale": 0,
                    "featureCollection": {
                        "layers": [
                            {
                                "layerDefinition": {
                                    "name": "pointLayer",
                                    "geometryType": "esriGeometryPoint"
                                },
                                "featureSet": {
                                    "geometryType": "esriGeometryPoint",
                                    "features": []
                                }
                            }
                        ]
                    }
                };

                for(i = 0 ; i < markers.length ; i++){
                    symbol = this.base64Icon(markers[i].color);
                    xy = webMercatorUtils.lngLatToXY(markers[i].longitude, markers[i].latitude);
                    f = {
                        "geometry": {
                            "x": xy[0],
                            "y": xy[1],
                            "spatialReference": {
                                "wkid": 102100,
                                "latestWkid": 3857
                            }
                        },
                        "symbol": {
                            "type": "esriPMS",
                            "url": markers[i].color + ".png",
                            "contentType": symbol.type,
                            "width": markers[i].width || 12,
                            "height": markers[i].height || 24,
                            "xoffset": markers[i].xoffset || 0,
                            "yoffset": markers[i].yoffset || 0,
                            "angle": markers[i].angle || 0,
                            "imageData": symbol.imageData
                        }
                    };
                    layer.featureCollection.layers[0].featureSet.features.push(f);
                }

                return layer;
            }
        });
    }
);
