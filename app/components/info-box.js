import Ember from 'ember';

export default Ember.Component.extend({

    didRender : function() {
        // console.log("The log is ", this.get("log"));
    },
    actions : {
        toggleCasualties : function(num) {
            this.sendAction('action', {
                forward : "toggleCasualties",
                num     : num

            });
        },
        openDiagram : function(type) {
            this.sendAction('action', {
                forward : "showDiagram",
                type    : type
            });
        },
        close : function(target) {
            this.sendAction('action', {
                forward : "closeInfo"
            });
        },
        showLog : function() {
            // console.log(this.get("log"));
            this.set("show-log", true);
        },
        closeLog : function() {
            this.set("show-log", false);
        },
        reverseLog : function(key) {
            this.sendAction('action', {
                forward : "reverseLog",
                key     : key
            })
        }

    }
});
