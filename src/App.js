import './App.css';
import '@esri/calcite-components/dist/calcite/calcite.css';
import '@esri/calcite-components/dist/components/calcite-button';
import '@esri/calcite-components/dist/components/calcite-panel';
import '@esri/calcite-components/dist/components/calcite-action';
import Basemap from '@arcgis/core/Basemap';
import esriConfig from '@arcgis/core/config.js';
import Circle from '@arcgis/core/geometry/Circle';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import VectorTileLayer from '@arcgis/core/layers/VectorTileLayer';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import Search from '@arcgis/core/widgets/Search';
import Zoom from '@arcgis/core/widgets/Zoom';
import * as arcgisRest from '@esri/arcgis-rest-places';
import * as requestTools from '@esri/arcgis-rest-request';
import {
  CalciteAction,
  CalciteButton,
  CalcitePanel,
} from '@esri/calcite-components-react';
import { setAssetPath } from '@esri/calcite-components/dist/components';
import React, { useEffect, useRef, useState } from 'react';

setAssetPath('https://js.arcgis.com/calcite-components/1.3.1/assets');

export default function App() {
  const apiKey =
    'AAPKdad20453b60944a48fc56ff00760d6e8RWGSzSxCJrKk5hUxSUuYfzhxFGVXbERKmOO-xqrJmNGGWJaGaEEpkKnC5ppVfb-T';

  esriConfig.apiKey = apiKey;

  const serviceUrl = `https://places-api.arcgis.com/arcgis/rest/services/places-service/v1/places/near-point?categoryIds=14000&xmin=16.36&ymin=48.21&xmax=16.2&ymax=48.1&&token=${apiKey}&f=pjson`;

  const mapRef = useRef(null);

  const radius = 5000;

  const [categoryArr, setCategoryArr] = useState([]);
  const [icon, setIcon] = useState('chevrons-right');
  const [width, setWidth] = useState('auto');
  const [categoryName, setCategoryName] = useState('All');
  const [mapView, setMapView] = useState(new MapView());
  const [map, setMap] = useState(new Map());

  const categorySet = new Set();

  const authentication = requestTools.ApiKeyManager.fromKey(apiKey);

  const graphicsLayer = new GraphicsLayer();

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

    function getCategories() {
      arcgisRest
        .getCategories({
          authentication,
        })
        .then((response) => {
          response.categories.forEach((category) => {
            if (category.fullLabel[0]) {
              categorySet.add(category.fullLabel[0]);
              setCategoryArr(categorySet);
            }
          });
        });
    }

    getCategories();

    setMapView(view);

    setMap(map);
  }, []);

  useEffect(() => {
    console.log(categoryName);
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

    mapView.on('click', function (event) {
      console.log('viewon', categoryName);
      graphicsLayer.removeAll();
      const lon = Math.round(event.mapPoint.longitude * 1000) / 1000;
      const lat = Math.round(event.mapPoint.latitude * 1000) / 1000;

      if (lon && lat) {
        console.log('on click', categoryName);

        arcgisRest
          .findPlacesNearPoint({
            x: lon,
            y: lat,
            radius,
            searchText: categoryName,
            authentication,
          })
          .then((response) => {
            if (response.results.length > 0) {
              mapView.goTo({
                target: [lon, lat],
                zoom: 11,
              });

              console.log('fpnp', response.results);
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
              });
            } else {
              mapView.goTo({
                target: [lon, lat],
                zoom: 9,
              });
              console.log('no results');
            }
          });

        const circleGeometry = new Circle({
          center: [lon, lat],
          geodesic: true,
          numberOfPoints: 100,
          radius: radius,
        });

        const circleGraphic = new Graphic({
          geometry: circleGeometry,
          symbol: {
            type: 'simple-fill',
            color: [207, 207, 207, 0.5],
            outline: {
              width: 2,
              color: [245, 154, 154, 0.8],
            },
          },
        });
        graphicsLayer.add(circleGraphic);
        map.add(graphicsLayer);
      }
    });
  }, [categoryName, map]);

  function handlePanelWidth() {
    if (icon === 'chevrons-right') {
      setIcon('chevrons-left');
      setWidth('0px');
    } else {
      setIcon('chevrons-right');
      setWidth('auto');
    }
  }

  return (
    <div className="App">
      <div id="viewDiv" ref={mapRef}>
        <CalciteAction
          icon={icon}
          onClick={handlePanelWidth}
          text="Categories"
          className="toggle-btn"
        ></CalciteAction>
        <CalcitePanel
          className="btn-container"
          id="btn-container"
          style={{ width: width }}
        >
          {Array.from(categoryArr).map((categoryLabel) => (
            <CalciteButton
              key={categoryLabel}
              className="category-btn"
              value={categoryLabel}
              round
              onClick={(e) => {
                setCategoryName(e.target.value);
              }}
            >
              {categoryLabel}
            </CalciteButton>
          ))}
        </CalcitePanel>
      </div>
    </div>
  );
}
