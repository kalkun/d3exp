import Ember from 'ember';

export default Ember.Component.extend({
    width : window.innerWidth,
    height : window.innerHeight,

    color : d3.scale.ordinal()  
        .range(['#ffffe5','#fff7bc','#fee391','#fec44f','#fe9929','#ec7014','#cc4c02','#993404','#662506']),


    didRender : function() {

        var _this = this;
        this.set("collection", 

            d3.nest()
            .key(function(d) {return d[_this.get("meta.type")]}) // d.perpetrator})
            .rollup(function(leaves) {
                return {
                    count : leaves.length,
                    name : leaves[0][_this.get("meta.type")]
                }
            })
            .entries(this.get("data")).reverse()
        );
        this.get("color").domain(this.get("collection.length"))
        this.update()
    },

    update : function() {

        var _this = this;
        var color = this.get("color");
        var radius = Math.min(_this.get("width"), _this.get("height")) / 3;
        var arc = d3.svg.arc()
            .outerRadius(radius * 0.6)
            .innerRadius(radius * 0.4);


        var pie = d3.layout.pie()
            .sort(null)
            .value(function(d) { return d.values.count; });

        var data = pie(this.get("collection")),
            width = this.get("width"),
            height = this.get("height")


        var g = d3.select(".diagram").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        var oldValues = null;
        var path = g.selectAll("path")
            .data(data)
          .enter().append("path")
            .attr("fill", function(d) { return color(d.data.values.name);  })
            .on("mouseover", function(d) { 
                var cls = "." + d.data.values.name.replace(/\W/g, '')
                var label = _this.$(cls);
                oldValues = {
                    cls          : cls,
                    transform   : label.attr("transform"),
                    textAnchor : label.attr("text-anchor")
                };
                _this.$(".diagram text.perp-label").attr("style", "visibility:hidden;");
                label
                    .attr("style", "visibility:visible;")
                    .attr("transform", null)
                    .attr("dy", "-50")
                    .attr("text-anchor", "middle");               
            })
            .on("mouseout", function(d) {
                g.selectAll(oldValues.cls)
                    .attr("transform", oldValues.transform)
                    .attr("text-anchor", oldValues.textAnchor)
                    .attr("dy", null)
                _this.$(".diagram text.default").attr("style", "visibility:visible;");
            })
            .attr("d", arc);

        // credit to Lars Kotthoff
        // http://stackoverflow.com/a/21775732/2853237
        var getAngle = function (d) {
            return (180 / Math.PI * (d.startAngle + d.endAngle) / 2 - 90);
        };

        g.selectAll("text").data(data)
            .enter()
            .append("text")
            .attr("class", function(d) {
                var cls = d.data.values.name.replace(/\W/g, '');
                if (d.endAngle- d.startAngle < 0.05) {
                    cls += " minor";
                } else {
                    cls += " default"
                }
                return cls + " perp-label";
            })
            .attr("dx", ".35em")
            .attr("text-anchor", function(d) {
                // are we past the center?
                return (d.endAngle + d.startAngle)/2 > Math.PI ?
                    "end" : "start";
            })
            .attr("x", function(d) {
                var a = d.startAngle + (d.endAngle - d.startAngle)/2 - Math.PI/2;
                d.cx = Math.cos(a) * (radius * 0.5);
                // return d.x = Math.cos(a) * (radius * 0.8);
            })
            .attr("y", function(d) {
                var a = d.startAngle + (d.endAngle - d.startAngle)/2 - Math.PI/2;
                d.cy = Math.sin(a) * (radius * 0.5);
                // return d.y = Math.sin(a) * (radius * 0.8);
            })
            .attr("transform", function(d) { 
                var r = getAngle(d);
                var c = arc.centroid(d);
                c[0] *= 1.2; 
                c[1] *= 1.2;
                if ((d.endAngle + d.startAngle)/2 > Math.PI) {
                    r +=180;
                    c[0] *= 1.1; 
                    c[1] *= 1.01;
                }

                return "translate(" + c + ") " +
                    "rotate(" + r + ")"; 
            })
            .text(function(d) { return d.data.values.name; });

        var title = g.append("text")            
            .attr("dx", 0)
            .attr("dy", "-20")
            .attr("text-anchor", "middle")

        title.append("tspan")
            .attr("x", 0)
            .attr("y", "1.4em")
            .attr("style", "font-size:20px;")
            .text(this.get("meta.type")[0].toUpperCase() + this.get("meta.type").slice(1, this.get("meta.type.length")) + "s")

        title.append("tspan")
            .attr("x", 0)
            .attr("y", "2.4em")
            .text(this.get("meta.city") + ", " + this.get("meta.country"))
    },

    actions : {
        close : function() {
            this.sendAction();
            this.set("show-diagram", false);
        }
    },

     willDestroyElement: function() {
        this.$().off('mouseenter mouseleave');
    }
});
