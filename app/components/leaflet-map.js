import Ember from 'ember';

export default Ember.Component.extend({
    hasInitialized : false,
    color : d3.scale.quantize()
            .range(['#fff5f0','#fee0d2','#fcbba1','#fc9272','#fb6a4a','#ef3b2c','#cb181d','#99000d'])
            .domain([68,110]),

    setText : function(d) {
        return  "Last incident: " + d.values.date + 
                "\nLocation: " + d.values.city + ", " + d.values.country +
                "\nIncidents: " + d.values.count + 
                "\nTotal fatalities: " + d.values.fatalities + 
                "\nTotal injuries: " + d.values.injuries + 
                "\nMost frequent weapon: " + d.values.weapon.name + 
                "\nMost frequent known perpetrator: " + d.values.perpetrator.name;
    },

    getFrequency : function(arr, key, exclude) {
        exclude = exclude || [];
        var freqs = {}
        var name = '';
        var max = 0;
        for (var i = 0, len = arr.length; i < len; i++) {
            var val = arr[i][key]
            if (val in exclude) {
                continue;
            } 
            freqs[val] = (freqs[val] || 0) +1; 
            if (freqs[val] > max) {
                max = freqs[val];
                name = val;
            }
        }
        return {
            name : name,
            mode : max
        }
    },

    getRollUp : function(collection, byIncidents) {
        var _this = this;
        return d3.nest()
            .key(function(d) { return d.stamp}) 
            .rollup(function(leaves) {
                return {
                    stamp       : leaves[0].stamp,
                    count       : leaves.length,
                    fatalities  : d3.sum(leaves, function(d) {
                        return d.fatalities;
                    }),
                    injuries    : d3.sum(leaves, function(d) {
                        return d.injuries;
                    }),
                    city        : leaves[0].city,
                    country     : leaves[0].country,
                    weapon      : _this.getFrequency(leaves, "weapon"),
                    perpetrator : _this.getFrequency(leaves, "perpetrator", {"Unknown" : 0, "Other" : 1}),
                    date        : d3.max(leaves, function(d) {
                        return d.date
                    }),
                    coords      : leaves[0].coords,
                }
            })
            .entries(collection)
    },

    didRender : function() {
        var _this = this;
       
        if (_this.get("hasInitialized")) return;
         var map = L.map('map').setView([55.6, 12.5], 3),

             mapLink = 
                '<a href="http://openstreetmap.org">OpenStreetMap</a>';
             L.tileLayer(
                'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; ' + mapLink + ' Contributors',
                maxZoom: 18,
                minZoom:3
                }).addTo(map);

        new L.geoJson({"type": "LineString","coordinates":[[0,0],[0,0]]}).addTo(map);

        map._initPathRoot() 

        _this.set("map", map);
        var svg = d3.select("#map").select("svg"),
            g = svg.append("g");

        d3.csv("locations_latlong.csv", function(d) {
            if (!+d.latitude || !+d.longitude)
                return null;
            return {
                coords : new L.LatLng(+d.latitude, +d.longitude),
                stamp : d.latitude + d.longitude,
                date : d.Date,
                fatalities : +d.Fatalities,
                injuries : +d.Injuries,
                perpetrator : d.Perpetrator,
                description : d.Description,
                weapon : d.Weapon,

                city : d.City,
                country : d.Country
            };
        }, function(error, collection) {
            if (error) throw error;


            var rollUp = _this.getRollUp(collection);
            _this.set(
                "rollUp", 
                rollUp
            );

            var color = _this.get("color");




            var zoom = map.getZoom();
            var feature = g.selectAll("circle")
            .data(rollUp);
            _this.set("feature", feature)
            
            feature.enter().append("circle")

            .style("stroke", "black")  
            .style("opacity", .6) 
            .style("fill", function(d) { 
                return color(new Date(d.values.date).getYear())
            })

                
            _this.set(
                "text-titles", 
                feature.append("title")
                    .text(_this.setText)
            )
        
            map.on("viewreset", _this.update, _this);
            feature.on("click", function(a, b, c, d, e) {
                _this.send("circleClick", a);
            })





                
            _this.update();
            _this.set("data", collection);
            _this.set("hasInitialized", true);


        })      
    },

    update : function () {

        var _this = this;
        var rollUp = _this.get("rollUp");
        var map     = _this.get("map");
        var feature = _this.get("feature");
        var zoom = map.getZoom();
        var feature = this.get("feature");
        var color = this.get("color");
        var byIncidents = this.get("radius-toggle")

        feature = feature.data(rollUp)
        feature.exit().remove();

        this.set("feature", feature);

        feature.enter().append("circle")
            
            .append("title")
            .text(this.setText)

        feature
            .style("stroke", "black")  
            .style("opacity", .6) 
            .style("fill", function(d) { 
                return color(new Date(d.values.date).getYear())
            })
        var text = this.get("text-titles").data(rollUp);

            text.exit().remove()
            text.enter().append("titles")
            text.text(this.setText)

        this.set("text-titles", text);

        feature.attr("r", function(d) {

            var amount = byIncidents ? d.values.count : d.values.fatalities
            return zoom * Math.log(amount +1)

        });
        feature.attr("transform", 
        function(d) { 

            return "translate("+ 
                map.latLngToLayerPoint(d.values.coords).x +","+ 
                map.latLngToLayerPoint(d.values.coords).y +")";
            }
        )
    },
    "casual-toggle" : true, 
    "radius-toggle" : false,

    toggler : Ember.observer("casual-toggle", "radius-toggle", function() {

        var rollUp;
        var collection = this.get("data");

        if (this.get("casual-toggle")) {
            rollUp = this.getRollUp(collection);
        } else {
            rollUp = this.getRollUp(collection.filter(function(el) {
                    return el.fatalities > 0;
                }))
        }


        this.set("rollUp", rollUp);
        this.update(this.get("radius-toggle"));
        if (this.get("show-info")) {
            this.updateCityFocus()
        }
    }),

    updateCityFocus : function() {
        var _this = this;
        var city_id = this.get("selected-info")
        var city    = this.get("rollUp").find(function(el) {
            return el.values.stamp == city_id;
        })
        this.set("cityStats", this.get("data").filter(function(el) {
            if (!_this.get("casual-toggle"))
                return el.stamp == city_id && el.fatalities > 0;
            return el.stamp == city_id;
        }))

        this.set("cityOverview", {
            latest              : city.values.date,
            location            : city.values.city + ", " + city.values.country,
            incidents           : city.values.count,
            fatalities          : city.values.fatalities,
            injuries            : city.values.injuries,
            weapon              : city.values.weapon.name,
            weapon_count        : city.values.weapon.mode,
            perpetrator         : city.values.perpetrator.name,
            perpetrator_count   : city.values.perpetrator.mode
        });
        this.set("details", {
            "type" : "perpetrator", 
            "city" : city.values.city,
            "country" : city.values.country
        })
    },

    actions : {
        casualties : function() {
            this.toggleProperty("casual-toggle");
        },
        radius : function() {
            this.toggleProperty("radius-toggle");
        },
        circleClick : function(city) {


            this.set("selected-info", city.values.stamp)
            this.updateCityFocus();
            this.set("show-info", true);
        },

        closeInfo : function(target) {
            this.set("show-info", false); 
        },

        getMessage : function(action) {
            if (action.forward == "showDiagram") {

                var pieType = action.type
                // var currentCity = this.get("details");
                this.set("details.type", pieType)
                this.set("show-diagram", true);
            } else if (action.forward == "closeInfo") {
                this.set('show-info', false);
            } else if (action.forward == "toggleCasualties") {
                this.set("casual-toggle", action.num == 2)
                this.toggleProperty("casual-toggle")
            } else if (action.forward == "reverseLog") {
                this.set("cityStats", this.get("cityStats").reverseObjects());
            }
        }, 

        closeDiagram : function() {
            // old:
            this.set("show-diagram", false);
        }
    }



});
