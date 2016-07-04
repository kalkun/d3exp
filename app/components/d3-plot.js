import Ember from 'ember';

export default Ember.Component.extend({

    dataset     : [],
    width       : 1400,
    height      : 660,

    didRender : function() {
        var _this = this;
        
        d3.json("dk.json", function(error, dk) {
            if (error) throw error;
            _this.set("dkmap", dk);
            _this.setUp();
        })
    },

    setUp : function() {
        var _this = this;

        var svg = d3.select(".chart")
            .attr("width", _this.get("width"))
            .attr("height", _this.get("height"));

        var subunits = topojson.feature(_this.get("dkmap"), _this.get("dkmap.objects.subunits"));

        var projection = d3.geoMercator()
            .scale(1000)
            .translate([_this.get("width") / 3, _this.get("height") * 2.6]);

        var path = d3.geoPath()
            .projection(projection);

        svg.append("path")
            .datum(subunits)
            .attr("d", path);

        svg.selectAll(".subunits")
            .data(topojson.feature(_this.get("dkmap"), _this.get("dkmap.objects.subunits")).features)
            .enter().append("path")
            .attr("class", function(d) {return "subunit " + d.id; })
            .attr("d", path)

        // Borders:
        // svg.append("path")
        //     .datum(topojson.mesh(_this.get("dkmap"), _this.get("dkmap.objects.subunits"), function(a, b) { return a !== b && a.id !== "NOW"; }))
        //     .attr("d", path)
        //     .attr("class", "subunit-boundary");

        // svg.append("path")
        //     .datum(topojson.mesh(_this.get("dkmap"), _this.get("uk.objects.subunits"), function(a, b) { return a === b && a.id === "NOW"; }))
        //     .attr("d", path)
        //     .attr("class", "subunit-boundary DNK");
        svg.append("path")
            .datum(topojson.feature(_this.get("dkmap"), _this.get("dkmap.objects.places")))
            .attr("d", path)
            .attr("class", "place");

        svg.selectAll(".place-label")
            .data(topojson.feature(_this.get("dkmap"), _this.get("dkmap.objects.places")).features)
          .enter().append("text")
            .attr("class", "place-label")
            .attr("transform", function(d) { return "translate(" + projection(d.geometry.coordinates) + ")"; })
            .attr("dy", ".35em")
            .attr("dx", ".35em")
            .text(function(d) { 
                // console.log(d.properties.name);
                if (d.properties.name == "Esbjerg" ||
                    d.properties.name == "Svendborg")
                    return;
                if (d.properties.name == "Kdbenhavn")
                    d.properties.name = "København";
                if (d.properties.name == "Prhus")
                    d.properties.name = "Århus"; 
                return d.properties.name; });

        svg.call(d3.zoom().on("zoom", zoomed));



    }   
});
