import Ember from 'ember';

export default Ember.Component.extend({
    didRender : function() {
        console.log("heyo");
        var _this = this;
        var collection = _this.get("data");

        _this.set("rollUp", _this.getRollUp(collection.filter(function(el) {
            return el.perpetrator.indexOf("Al Qaeda") > -1;
        })));
        console.log(_this.get("rollUp"));

    },

    getRollUp : function(collection, byIncidents) {
        var _this = this;
        return d3.nest()
            // .key(function(d) {
            //     return d.perpetrator;
            // })
            .key(function(d) { 
                // return _this.checkValidLocale(d) ? d.city + d.country : d.stamp;
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
    }

});
