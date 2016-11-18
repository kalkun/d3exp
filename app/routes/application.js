import Ember from 'ember';

export default Ember.Route.extend({
   model : function() {
        return new Ember.RSVP.Promise(function(resolve, reject) {
            d3.csv("mergedDatasetCleaned2.csv", function(d) {
                if (!+d.latitude || !+d.longitude || !d.Perpetrator)
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
                if (error) reject(error);
                resolve(collection);
            });
        })
   } 
});
