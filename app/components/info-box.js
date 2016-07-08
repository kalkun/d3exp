import Ember from 'ember';

export default Ember.Component.extend({

    // classNames : ["info-box"],

    didRender : function() {
        // alert("we're live!");
        // console.log(this.get("data"))
    },

    actions : {
        toggleCasualties : function() {
            this.sendAction('action', {
                forward : "toggleCasualties"
            });
        },
        openDiagram : function(type) {
            this.sendAction('action', {
                forward : "showDiagram",
                type    : type
            });
        },
        close : function(target) {
            console.log(this.$(target).find(".info-box"))
            console.log("target ", target)
            this.sendAction('action', {
                forward : "closeInfo"
            });
        }
    }
});
