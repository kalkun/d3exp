import Ember from 'ember';

export default Ember.Component.extend({
    hasInitialized : false,
    availableTags : [],
    listOfPerps : {},
    "casual-toggle" : false,
    format : d3.time.format("%Y-%m-%d"),
    startRange: 1968,
    endRange: 2015,

    "radius-toggle" : true,
    filterVal   : "",
    filterPerp : Ember.makeArray(),


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

    checkValidLocale : function(datapoint) {
        return datapoint.city && datapoint.country && datapoint.city != "Unknown";

    },

    getRollUp : function(collection, byIncidents) {
        var _this = this;
        return d3.nest()
            .key(function(d) {
                if (!_this.get("firstRollUp")) {
                    if (_this.get("listOfPerps").hasOwnProperty(d.perpetrator)) {
                        _this.get("listOfPerps")[d.perpetrator] += 1;
                    } else {
                        _this.get("listOfPerps")[d.perpetrator] = 1;
                        _this.get("availableTags").pushObject(d.perpetrator);
                    }
                }
                return d.stamp;
            })

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
                    coords      : leaves[0].coords
                }
            })
            .entries(collection)
    },

    setDomainRange : function() {
        var _this = this;
        _this.set("color", d3.scale.quantize()
            .range(['#fff5f0','#fee0d2','#fcbba1','#fc9272','#fb6a4a','#ef3b2c','#cb181d','#99000d'])
            .domain([_this.get("startRange") - 1900, _this.get("startRange") - 1899 + _this.get("endRange") - _this.get("startRange")]));
    },

    didRender : function() {
        var _this = this;

        if (_this.get("hasInitialized")) return;
            _this.setDomainRange();
        _this.set("hasInitialized", true);
        var url = "https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiazRsayIsImEiOiJjaXcza2N0NGQwMDBsMnltbzBxdmJtbGg3In0.VXQxTuebIXo-YVKA1rULbA";
        var map = L.map('map').setView([55.6, 12.5], 3),

             mapLink =
                '<a href="http://openstreetmap.org">OpenStreetMap</a>';
             L.tileLayer(
                // 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                url, {
                attribution: '&copy; ' + mapLink + ' Contributors',
                maxZoom: 18,
                minZoom:3,
                noWrap : true
                }).addTo(map);

        map._initPathRoot()

        _this.set("map", map);
        var svg = d3.select("#map").select("svg"),
            g = svg.append("g");

        // data is provided by the model
        var collection = _this.get("data");

            var rollUp = _this.getRollUp(collection.filter(function(el) {
                    return (Ember.isEmpty(_this.get("filterPerp")) || _this.checkFilter(el)) && el.fatalities > 0;
                }));
            _this.set("firstRollUp", true);

            _this.set("rollUp", rollUp);

            var color = _this.get("color");

            var zoom = map.getZoom();
            var feature = g.selectAll("circle")
            .data(rollUp);
            _this.set("feature", feature)

            feature.enter().append("circle")

            .style("stroke", "black")

            .style("opacity", .6)

            .style("fill", function(d) {

                return d.values.date.match(/-0$/) ?
                    color(new Date(d.values.date.replace(/-0$/, '-1')).getYear()) :

                    color(new Date(d.values.date).getYear());
            });

            _this.set(
                "text-titles",
                feature.append("title")
                    .text(_this.setText)
            )

            map.on("viewreset", _this.update, _this);
            feature.on("click", function(a) {
                _this.send("circleClick", a);
            })

            _this.update();
            _this.set("data", collection);

        // set up filter search input field
        Ember.$("#filterSearch").autocomplete({
            source: function(req, response) {
                var results = $.ui.autocomplete.filter(_this.get("availableTags"), req.term);
                response(results.slice(0, 10));//for getting 10 results
            },
            select : function(event, ui) {
                if (_this.get("filterPerp").find(function(filter) {
                    return filter == ui.item.value.toLowerCase();
                })) {
                    return;
                } else {
                    _this.get("filterPerp").addObject(ui.item.value.toLowerCase());
                    _this.notifyPropertyChange("casual-toggle");
                    _this.set("lastFilterPerp", _this.get("filterPerp"));
                    _this.set("filterVal", "");
                    _this.get("availableTags").removeObject(ui.item.value);
                }
            }
        });

        Ember.$(".drag-slide").dragslider({
            range : true,
            min : 1968,
            max : 2015,
            rangeDrag: true,
            values : [1968, 2015],
            stop : function(event, ui) {
                _this.set("startRange", ui.values[0]);
                _this.set("endRange", ui.values[1]);

                _this.setDomainRange();
                _this.notifyPropertyChange("casual-toggle");
            },
            slide : function(event, ui) {
                _this.set("startRange", ui.values[0]);
                _this.set("endRange", ui.values[1]);
            }
        });
        
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

        _this.setDomainRange();
        feature = feature.data(rollUp)
        feature.exit().remove();

        this.set("feature", feature);

        feature.enter().append("circle")

            .on("click", function(a) {
                _this.send("circleClick", a);
            })
            .append("title")
            .text(this.setText)

        feature
            .style("stroke", "black")

            .style("opacity", .6)

            .style("fill", function(d) {

                return d.values.date.match(/-0$/) ?

                    color(new Date(d.values.date.replace(/-0$/, '-1')).getYear()) :

                    color(new Date(d.values.date).getYear());

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
        feature.attr("transform", function(d) {

            return "translate("+

                map.latLngToLayerPoint(d.values.coords).x +","+

                map.latLngToLayerPoint(d.values.coords).y +")";
            }
        )
    },

    toggler : Ember.observer("casual-toggle", "radius-toggle", function() {
        var _this = this;
        var rollUp;
        var collection = this.get("data");

        if (this.get("casual-toggle")) {
            rollUp = this.getRollUp(collection.filter(function(el) {
                return _this.checkFilter(el);
            }));
        } else {
            rollUp = this.getRollUp(collection.filter(function(el) {
                return _this.checkFilter(el) && el.fatalities > 0;
            }));
        }

        this.set("rollUp", rollUp);
        this.update(this.get("radius-toggle"));
        if (this.get("show-info")) {
            this.updateCityFocus()
        }
    }),

    // is included by filter, otherwise false.
    checkFilter(el) {
        var name = el.perpetrator ? el.perpetrator.toLowerCase() : el.values.perpetrator.name.toLowerCase();
        var date = el.date || el.values.date;
        if (
                this.format.parse(date).getTime() < this.format.parse(this.get("startRange") + "-01-01").getTime() ||
                this.format.parse(date).getTime() > this.format.parse(this.get("endRange") + "-12-31").getTime()
            ) {
            return false;
        }
        return Ember.isEmpty(this.get("filterPerp")) || this.get("filterPerp").any(function(filter) {
            if (name.toLowerCase().indexOf(filter) > -1) {
                return true;
            }
        });
        return false;
    },

    updateCityFocus : function() {
        var _this = this;
        var city_id = this.get("selected-info")
        var city    = this.get("rollUp").find(function(el) {
            return el.values.stamp == city_id && _this.checkFilter(el);
        })
        this.set("cityStats", this.get("data").filter(function(el) {
            if (!_this.get("casual-toggle")) {
                return el.stamp == city_id && el.fatalities > 0 && _this.checkFilter(el, );
            }
            return el.stamp == city_id && _this.checkFilter(el);
        }).reverseObjects())

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
        },
        clearFilters : function() {
            this.set("filterPerp", []);
        },
        removeFilter(filter) {
            this.set("filterPerp", this.get("filterPerp").removeObject(filter))
            this.notifyPropertyChange("casual-toggle");
            if (Ember.isEmpty(this.get("filterPerp")) && this.get("lastFilterPerp")) {
                this.set("lastFilterPerp", "");
            }
        }

    }

});
