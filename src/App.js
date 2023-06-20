import "./App.css";
import "@esri/calcite-components/dist/calcite/calcite.css";
import "@esri/calcite-components/dist/components/calcite-button";
import "@esri/calcite-components/dist/components/calcite-panel";
import "@esri/calcite-components/dist/components/calcite-action";
import "@esri/calcite-components/dist/components/calcite-input";
import Basemap from "@arcgis/core/Basemap";
import esriConfig from "@arcgis/core/config.js";
import Circle from "@arcgis/core/geometry/Circle";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import VectorTileLayer from "@arcgis/core/layers/VectorTileLayer";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Zoom from "@arcgis/core/widgets/Zoom";
import * as arcgisRest from "@esri/arcgis-rest-places";
import * as requestTools from "@esri/arcgis-rest-request";
import * as intl from "@arcgis/core/intl";
import { CalciteButton, CalciteInput } from "@esri/calcite-components-react";
import { setAssetPath } from "@esri/calcite-components/dist/components";
import React, { useEffect, useRef, useState } from "react";
import config from "./config";

setAssetPath("https://js.arcgis.com/calcite-components/1.4.0/assets");
esriConfig.fontsUrl = "https://static.arcgis.com/fonts";

export default function App() {
  intl.setLocale("de-DE");
  const apiKey = config.API_KEY;

  esriConfig.apiKey = apiKey;

  // const serviceUrl = `https://places-api.arcgis.com/arcgis/rest/services/places-service/v1/places/near-point?categoryIds=14000&xmin=16.36&ymin=48.21&xmax=16.2&ymax=48.1&&token=${apiKey}&f=pjson`;

  const mapRef = useRef(null);

  const radius = 200;

  const [categoryName, setCategoryName] = useState("");
  const [mapView, setMapView] = useState(new MapView());
  const [map, setMap] = useState(new Map());

  // const categorySet = new Set();
  // const resultNumber = 20;

  const authentication = requestTools.ApiKeyManager.fromKey(apiKey);

  const graphicsLayer = new GraphicsLayer();
  const resultInfos = [];

  function getDetails(placeId) {
    arcgisRest
      .getPlaceDetails({
        placeId: placeId,
        requestedFields: ["all"],
        authentication,
      })
      .then((response) => {
        if (response) {
          resultInfos.push(response.placeDetails.name);
        }
      });
  }

  // fetch categories
  // function getCategories() {
  //   arcgisRest
  //     .getCategories({
  //       authentication,
  //     })
  //     .then((response) => {
  //       response.categories.forEach((category) => {
  //         if (category.fullLabel[0]) {
  //           categorySet.add(category.fullLabel[0]);
  //         }
  //       });
  //     });
  // }

  function findPlacesNear(event) {
    console.log("click");

    let pointGraphic;

    graphicsLayer.graphics.removeAll();

    lon.current = event?.mapPoint
      ? Math.round(event.mapPoint.longitude * 1000) / 1000
      : mapView.center.longitude;
    lat.current = event?.mapPoint
      ? Math.round(event.mapPoint.latitude * 1000) / 1000
      : mapView.center.latitude;

    if (lon && lat && categoryName.length > 0) {
      arcgisRest
        .findPlacesNearPoint({
          x: lon.current,
          y: lat.current,
          radius,
          searchText:
            searchBar.value > 0
              ? searchBar.value.replace(/\s/g, "%")
              : categoryName,
          authentication,
        })
        .then((response) => {
          if (response.results.length > 0) {
            mapView.goTo({
              target: [lon.current, lat.current],
              zoom: 15.5,
            });

            response.results.forEach((result) => {
              getDetails(result.placeId);

              const point = {
                //Create a point
                type: "point",
                longitude: result.location.x,
                latitude: result.location.y,
              };

              const imageUrl = `./${categoryName}.png`;
              const defaultImageUrl = "./default.png";

              const image = new Image();
              image.src = imageUrl;

              image.onload = function () {
                // Image exists, use it
                const symbol = {
                  type: "picture-marker",
                  url: imageUrl,
                  width: "24px",
                  height: "24px",
                };

                pointGraphic = new Graphic({
                  geometry: point,
                  symbol: symbol,
                });

                graphicsLayer.add(pointGraphic);
              };

              image.onerror = function () {
                // Image doesn't exist, use default image
                const symbol = {
                  type: "picture-marker",
                  url: defaultImageUrl,
                  width: "24px",
                  height: "24px",
                };

                pointGraphic = new Graphic({
                  geometry: point,
                  symbol: symbol,
                });

                graphicsLayer.add(pointGraphic);
              };
              console.log("results3:", result);
            });
          } else {
            mapView.goTo({
              target: [lon.current, lat.current],
              //zoom: 9,
            });
            console.log("no results");
          }

          // Add the graphics layer to the map
          map.add(graphicsLayer);
        });

      const circleGeometry = new Circle({
        center: [lon.current, lat.current],
        geodesic: true,
        numberOfPoints: 100,
        radius,
      });

      const circleSymbol = {
        type: "simple-fill",
        color: [207, 207, 207, 0.5],
        outline: {
          width: 2,
          color: [245, 154, 154, 0.8],
        },
      };

      circleGraphic = new Graphic({
        geometry: circleGeometry,
        symbol: circleSymbol,
      });

      graphicsLayer.add(circleGraphic);
    }
  }

  function findPlacesWithin(event) {
    let pointGraphic;

    if (graphicsLayer) {
      map.removeAll();
    }

    arcgisRest
      .findPlacesWithinExtent({
        xmin: 16.35,
        ymin: 48.17,
        xmax: 16.49,
        ymax: 48.28,
        pageSize: 20,
        searchText: searchBar.value
          ? searchBar.value.replace(/\s/g, "%")
          : categoryName,
        authentication,
      })
      .then((response) => {
        if (response.results.length > 0) {
          response.results.forEach((result) => {
            getDetails(result.placeId);

            const point = {
              //Create a point
              type: "point",
              longitude: result.location.x,
              latitude: result.location.y,
            };

            const imageUrl = event.target
              ? `./${event.target.value}.png`
              : `./${categoryName}.png`;
            const defaultImageUrl = "./default.png";

            const image = new Image();
            image.src = imageUrl;

            image.onload = function () {
              // Image exists, use it
              const symbol = {
                type: "picture-marker",
                url: imageUrl,
                width: "24px",
                height: "24px",
              };

              pointGraphic = new Graphic({
                geometry: point,
                symbol: symbol,
              });

              graphicsLayer.graphics.add(pointGraphic);
            };

            image.onerror = function () {
              // Image doesn't exist, use default image
              const symbol = {
                type: "picture-marker",
                url: defaultImageUrl,
                width: "24px",
                height: "24px",
              };

              pointGraphic = new Graphic({
                geometry: point,
                symbol: symbol,
              });

              graphicsLayer.graphics.add(pointGraphic);
            };
            console.log("results1:", result);
          });
        } else {
          console.log("no results");
        }
        map.add(graphicsLayer);
      });

    return function cleanup() {
      graphicsLayer.remove(pointGraphic);
    };
  }

  useEffect(() => {
    const vectorTileLayer = new VectorTileLayer({
      url: "https://arcgis.com/sharing/rest/content/items/9a171e7c0a2c4093ac20a184e6d4a9a9/resources/styles/root.json",
    });

    const basemap = new Basemap({
      baseLayers: [vectorTileLayer],
      title: "My Map",
      id: "My Map",
      thumbnailUrl:
        "https://austria.maps.arcgis.com/sharing/rest/content/items/9a171e7c0a2c4093ac20a184e6d4a9a9/info/thumbnail/thumbnail1674806732851.png",
    });
    const map = new Map({
      basemap: basemap,
    });

    const view = new MapView({
      container: mapRef.current,
      map: map,
      extent: {
        xmin: 1802947.3715664082,
        ymin: 6126338.071312931,
        xmax: 1841389.0059240693,
        ymax: 6154401.534302065,
        spatialReference: {
          wkid: 102100,
        },
      },
      zoom: 13,
      ui: {
        components: ["attribution"],
      },
    });

    const zoom = new Zoom({
      view: view,
    });

    view.ui.add(zoom, "top-right");

    view.when(setMapView(view), setMap(map));
  }, []);

  const lon = useRef(48.2);
  const lat = useRef(16.3);
  let circleGraphic; // Reference to the circle graphic

  const searchBar = document.getElementById("search-bar");

  useEffect(() => {
    if (searchBar) {
      searchBar.addEventListener("calciteInputChange", function (event) {
        if (event.target.value) {
          graphicsLayer.graphics.removeAll();
          setCategoryName(event.target.value);
          findPlacesWithin(event);
        }
      });
    }
  }, [mapView]);

  useEffect(() => {
    const clickHandler = mapView.on("click", function (event) {
      findPlacesNear(event);
    });

    // Cleanup event handler when the component unmounts
    return function cleanup() {
      clickHandler.remove();
      mapView.on("click", function () {
        graphicsLayer.removeAll();
      });
    };
  }, [categoryName, mapView]);

  function catChangeHandler(event) {
    setCategoryName(event.target.value);

    graphicsLayer.graphics.removeAll();

    setTimeout(() => {
      findPlacesWithin(event);
    });
  }

  return (
    <div className="App">
      <div id="viewDiv" ref={mapRef}>
        <div className="searchAndButtonsContainer">
          <CalciteInput
            type="search"
            placeholder="Nach Kategorie suchen"
            icon="search"
            value={categoryName}
            id="search-bar"
          ></CalciteInput>
          <CalciteButton
            className="category-btn"
            value="Dining and Drinking"
            round
            onClick={catChangeHandler}
            iconStart="rings"
          >
            Restaurants
          </CalciteButton>
          <CalciteButton
            className="category-btn"
            value="Arts and Entertainment"
            round
            onClick={catChangeHandler}
            iconStart="initiative"
          >
            Sehenswürdigkeiten
          </CalciteButton>
          <CalciteButton
            className="category-btn"
            value="Event"
            round
            onClick={catChangeHandler}
            iconStart="event"
          >
            Events
          </CalciteButton>
          <CalciteButton
            className="category-btn"
            value="Retail"
            round
            onClick={catChangeHandler}
            iconStart="shopping-cart"
          >
            Einzelhandel
          </CalciteButton>
        </div>
      </div>
    </div>
  );
}
