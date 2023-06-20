const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());

app.get(
  "https://www.storymaps.mysynergis.com/StoryMaps/arcgis-places-beta/",
  function (req, res, next) {
    res.json({ msg: "This is CORS-enabled for all origins!" });
  },
);

app.listen(80, function () {
  console.log("CORS-enabled web server listening on port 80");
});
