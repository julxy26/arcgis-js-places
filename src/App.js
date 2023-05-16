import './App.css';
import Basemap from '@arcgis/core/Basemap';
import esriConfig from '@arcgis/core/config.js';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import VectorTileLayer from '@arcgis/core/layers/VectorTileLayer';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import Search from '@arcgis/core/widgets/Search';
import Zoom from '@arcgis/core/widgets/Zoom';
import * as arcgisRest from '@esri/arcgis-rest-places';
import * as requestTools from '@esri/arcgis-rest-request';
import React, { useEffect, useRef, useState } from 'react';

export default function App() {
  const [lon, setLon] = useState('');
  const [lat, setLat] = useState('');

  const apiKey =
    'AAPKdad20453b60944a48fc56ff00760d6e8RWGSzSxCJrKk5hUxSUuYfzhxFGVXbERKmOO-xqrJmNGGWJaGaEEpkKnC5ppVfb-T';

  const authentication = requestTools.ApiKeyManager.fromKey(apiKey);

  esriConfig.apiKey = apiKey;

  const serviceUrl = `https://places-api.arcgis.com/arcgis/rest/services/places-service/v1/places/near-point?categoryIds=14000&xmin=16.36&ymin=48.21&xmax=16.2&ymax=48.1&&token=${apiKey}&f=pjson`;

  const mapRef = useRef(null);

  useEffect(() => {
    const vectorTileLayer = new VectorTileLayer({
      url: 'https://arcgis.com/sharing/rest/content/items/9a171e7c0a2c4093ac20a184e6d4a9a9/resources/styles/root.json',
    });

    const basemap = new Basemap({
      baseLayers: [vectorTileLayer],
      title: 'My Map',
      id: 'My Map',
      thumbnailUrl:
        'https://austria.maps.arcgis.com/sharing/rest/content/items/9a171e7c0a2c4093ac20a184e6d4a9a9/info/thumbnail/thumbnail1674806732851.png',
    });

    const map = new Map({
      basemap: basemap,
    });

    const view = new MapView({
      container: mapRef.current,
      map: map,
      extent: {
        xmin: 1594077.41119378,
        ymin: 6140714.59721381,
        xmax: 1743644.06561979,
        ymax: 5961023.4106706,
        spatialReference: {
          wkid: 102100,
        },
      },
      zoom: 8,
      ui: {
        components: ['attribution'],
      },
    });

    const search = new Search({
      view: view,
    });

    view.ui.add(search, {
      position: 'top-left',
    });

    const zoom = new Zoom({
      view: view,
    });

    view.ui.add(zoom, {
      position: 'top-left',
    });

    const graphicsLayer = new GraphicsLayer();

    function getDetails(placeId) {
      arcgisRest
        .getPlaceDetails({
          placeId: placeId,
          requestedFields: ['all'],
          authentication,
        })
        .then((response) => {
          console.log('Place details:', response.placeDetails);
        });
    }

    view.on('click', function (event) {
      const lon = Math.round(event.mapPoint.longitude * 1000) / 1000;
      const lat = Math.round(event.mapPoint.latitude * 1000) / 1000;
      console.log('click', lat, lon);

      if (lon && lat) {
        arcgisRest
          .findPlacesNearPoint({
            x: lon,
            y: lat,
            radius: 10000,
            categoryIds: ['16000'],
            authentication,
          })
          .then((response) => {
            response.results.forEach((result) => {
              getDetails(result.placeId);

              const point = {
                //Create a point
                type: 'point',
                longitude: result.location.x,
                latitude: result.location.y,
              };
              const simpleMarkerSymbol = {
                type: 'simple-marker', // autocasts as new SimpleMarkerSymbol()
                style: 'circle',
                color: [217, 35, 22],
                size: '10px', // pixels
                outline: {
                  color: [217, 35, 22],
                  width: '0px',
                },
              };

              const pointGraphic = new Graphic({
                geometry: point,
                symbol: simpleMarkerSymbol,
              });

              graphicsLayer.add(pointGraphic);
              map.add(graphicsLayer);
            });
          });
      }
    });
  }, []);

  return <div id="viewDiv" ref={mapRef}></div>;
}
