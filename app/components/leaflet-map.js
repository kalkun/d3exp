import Ember from 'ember';

export default Ember.Component.extend({
    hasInitialized : false,
    color : d3.scale.quantize()
            .range(['#fff5f0','#fee0d2','#fcbba1','#fc9272','#fb6a4a','#ef3b2c','#cb181d','#99000d'])
            .domain([68,110]),

    didRender : function() {
        var _this = this;
       
        if (_this.get("hasInitialized")) return;
         var map = L.map('map').setView([55.6, 12.5], 3),
         // var map = L.map('map').setView([-41.2858, 174.7868], 13),
             mapLink = 
                '<a href="http://openstreetmap.org">OpenStreetMap</a>';
             L.tileLayer(
                'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; ' + mapLink + ' Contributors',
                maxZoom: 18,
                minZoom:3
                }).addTo(map);

        new L.geoJson({"type": "LineString","coordinates":[[0,0],[0,0]]}).addTo(map);

        // initialize an svg element controlled by leaflet.
        map._initPathRoot() 

        _this.set("map", map);

        // var svg = d3.select(map.getPanes().overlayPane).append("svg")
        var svg = d3.select("#map").select("svg"),
            g = svg.append("g");

        // var color = d3.scale.category20c();  // d3 has built-in Colors - Color Set 3
        // var color = d3.scale.ordinal(d3.scale.category20c);
        // color.domain([0, 41]);


        // var dataset = d3.range([0, 41]);

        // for (var i = 0; i < 100; i++) {
        //     console.log("color: ", color(i))
        // }
        // console.log("standard ", color());
        d3.csv("locations_latlong.csv", function(d) {
            // console.log(d);
            // console.log("count", +d.Count)
            // console.log(d);
            if (!+d.latitude || !+d.longitude)
                return null;
            return {
                coords : new L.LatLng(+d.latitude, +d.longitude),
                // year : new Date(d.Date).getYear(),
                date : d.Date,
                fatalities : d.Fatalities,
                injuries : d.Injuries,
                perpetrator : d.Perpetrator,
                description : d.Description,
                weapon : d.Weapon,
                // count : +d.Count,
                city : d.City,
                country : d.Country
            };
        }, function(error, collection) {
            if (error) throw error;

            // console.log(collection);
               var rollUp = d3.nest()
                .key(function(d) { return d.city}) 
                .rollup(function(leaves) { 
                    return {
                        count   : leaves.length,
                        city    : leaves[0].city,
                        country : leaves[0].country,
                        date    : d3.max(leaves, function(d) {
                            // console.log(d.date) 
                            return d.date
                        }),
                        coords  : leaves[0].coords,


                    }
                })
                .entries(collection)
            _this.set(
                "rollUp", 
                rollUp
            );

            var color = _this.get("color");
            
            // for (var i = 68; i < 110; i++) {
            //     console.log(i, color(i), ['#fff5f0','#fee0d2','#fcbba1','#fc9272','#fb6a4a','#ef3b2c','#cb181d','#99000d'].indexOf(color(i)) +1 );
            // }
            // console.log(collection);
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
                    .text(function(d) {
                        return "Date: " + d.values.date + "\n" + "Location: " + d.values.city + "," + d.values.country + "\n" + "Incidents: " + d.values.count;
                    })
            )
        
            map.on("viewreset", _this.update, _this);

            // var promise = new Promise(function(resolve) {
                // console.log("ost ", ost);
                // resolve()                
            // }).then(function() {
            // console.log(_this.get("rollUp"));
                
            _this.update();
            _this.set("data", collection);
            _this.set("hasInitialized", true);
            // })

        })      
    },

    update : function () {
        // console.log("map zoom ", map.getZoom(), 4 * map.getZoom(), Math.pow(map.getZoom(), 2));
        var _this = this;
        var rollUp = _this.get("rollUp");
        var map     = _this.get("map");
        var feature = _this.get("feature");
        var zoom = map.getZoom();
        feature.attr("r", function(d) {
            // return zoom * Math.log(d.count);
            // console.log(d.values.count, rollUp[d.city], d.city)

            return zoom * Math.log(d.values.count +1)
            // return zoom * Math.log(rollUp[d.city].count)
        });
        feature.attr("transform", 
        function(d) { 
            // console.log("OST ", d)
            return "translate("+ 
                map.latLngToLayerPoint(d.values.coords).x +","+ 
                map.latLngToLayerPoint(d.values.coords).y +")";
            }
        )
    },
    "casual-toggle" : true, 

    toggleCasualties : Ember.observer("casual-toggle", function() {

        var collection = this.get("data");
        var feature = this.get("feature");
        // feature.data([]).exit().remove()
        var color = this.get("color");
        var rollUp;
        // console.log("casualties toggle", this.get("casual-toggle"));
        if (this.get("casual-toggle")) {
            rollUp = d3.nest()
                .key(function(d) { return d.city}) 
                .rollup(function(leaves) { 
                    return {
                        count   : leaves.length,
                        city    : leaves[0].city,
                        country : leaves[0].country,
                        date    : d3.max(leaves, function(d) {
                            // console.log(d.date) 
                            return d.date
                        }),
                        coords  : leaves[0].coords,
                    }
                })
                .entries(collection)
        } else {
            rollUp = d3.nest()
                .key(function(d) { return d.city}) 
                .rollup(function(leaves) { 
                    return {
                        count   : leaves.length,
                        city    : leaves[0].city,
                        country : leaves[0].country,
                        date    : d3.max(leaves, function(d) {
                            // console.log(d.date) 
                            return d.date
                        }),
                        coords  : leaves[0].coords,


                    }
                })
                .entries(collection.filter(function(el) {
                    // if (el.city == "Krakow") console.log(el.city, el);
                    // if (el.city == "Copenhagen") console.log(el.city, el)
                    return el.fatalities > 0;
                }))
        }
        // console.log(rollUp.find(function(d) {
        //     if (d.key == "Krakow") console.log(d.key, d)
        //     if (d.key == "Copenhagen") console.log(d.key, d)
        //     return d.key == "Krakow";
        // }))
        feature = feature.data(rollUp)
        feature.exit().remove();
        // feature.enter().append("circle");
        this.set("feature", feature);

        feature.enter().append("circle")
            .style("stroke", "black")  
            .style("opacity", .6) 
            .style("fill", function(d) { 
                return color(new Date(d.values.date).getYear())
            })
            .append("title")
            .text(function(d) {
                return "Date: " + d.values.date + "\n" + "Location: " + d.values.city + "," + d.values.country + "\n" + "Incidents: " + d.values.count;
            })
            // feature.selectAll("title").exit().remove()
            console.log("exit titles ", feature.selectAll("title").data(rollUp));
        // feature.selectAll("svg:title").exit().remove()
        // feature.selectAll("svg:title").remove()
        // feature.append("svg:title")
        // var text = this.get("text-titles")
        // this.set("text-titles", text.data(rollUp))
        var text = this.get("text-titles").data(rollUp);

            // .data(rollUp)
            console.log("enter ", text.enter(), "\nexit ", text.exit(), "\ntext ", text.append('titles'))
            console.log("enter ", feature.enter(), "\nexit ", feature.exit(), "\ntext ", feature.append('titles'))
            text.exit().remove()
            text.enter().append("titles")
            text.text(function(d) {
                // if (d.key == "Krakow") console.log(d)
                return "Date: " + d.values.date + "\n" + "Location: " + d.values.city + "," + d.values.country + "\n" + "Incidents: " + d.values.count;
            });
        // this.set("feature", feature)
        this.update();
        this.set("text-titles", text);
    }),

    actions : {
        casualties : function() {
            this.toggleProperty("casual-toggle");
            // this.get("toggleCasualties");
        }
    }



});
