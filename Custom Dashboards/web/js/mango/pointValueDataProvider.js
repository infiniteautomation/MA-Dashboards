/**
 * Javascript Objects for the Providing Data on HTML pages.  
 * 
 * 
 * Copyright (C) 2014 Infinite Automation Software. All rights reserved.
 * @author Terry Packer
 */


/**
 * Data Provider
 * @param id
 * @param point
 * @param configuration
 * @param options
 * @returns
 */
PointValueDataProvider = function(id, options){
    
    this.id = id;
    this.listeners = new Array();
    this.pointConfigurations = new Array();
    
    this.rollup = 'AVERAGE';
    this.timePeriodType = 'HOURS';
    this.timePeriods = 1;
    
    for(var i in options) {
        this[i] = options[i];
    }
};

PointValueDataProvider.prototype = {

        type: 'PointValueDataProvider',
        
        id: null, //Unique ID for reference (use Alphanumerics as auto generated ones are numbers)
        pointConfigurations: null, //List of Points + configurations to use
        from: null, //From date
        to: null, //To Date
        rollup: null, //['AVERAGE', 'MAXIMUM', 'MINIMUM', 'SUM', 'FIRST', 'LAST', 'COUNT']
        timePeriodType: null,  //['MINUTES', 'HOURS', 'DAYS', 'WEEKS', 'MONTHS', 'YEARS' 'MILLISECONDS', 'SECONDS']
        timePeriods: null,
        
        listeners: null, //Listeners to send new data when load() completes
//        pointValues: null, //An array of our data - post processed
        
        /**
         * Optionally manipulate data.
         * 
         *  Send in this method in the options during object creation.
         * 
         * @param data - list of point value times
         * @param point - dataPoint corresponding to pvts
         * @return Array of manipulated data
         */
        manipulateData: null,
        
        /**
         * Signal to all Listeners to clear ALL their data
         */
        clear: function(){
            for(var i=0; i<this.listeners.length; i++){
                this.listeners[i].onClear();
            }

        },
        /**
         * Load our data and publish to listeners
         * 
         * @param error - method to call on error
         */
        load: function(error){
            
            //TODO Fix up for promise using deferred and da
            //Load in the data into time order and perform data operations
            var deferred = $.Deferred();
            //Start resolving the chain
            deferred.resolve();

            var self = this;
            for(var x=0; x<this.pointConfigurations.length; x++){
                var pos = x;
                var da = mangoRest.pointValues.get(this.pointConfigurations[x].point.xid, 
                        mangoRest.formatLocalDate(this.from),
                        mangoRest.formatLocalDate(this.to),
                        this.rollup, this.timePeriodType, this.timePeriods,
                        function(data){

                    //Optionally manipulate the data
                    if(self.manipulateData != null)
                        data = self.manipulateData(data, self.pointConfigurations[pos].point);
                    
                    //Inform our listeners of this new data
                    for(var i=0; i<self.listeners.length; i++){
                        self.listeners[i].onLoad(data, self.pointConfigurations[pos].point);
                    }
                },error);
                
                //Form Chain
            }
           
            return deferred;
        },
        
        /**
         * Add a listener who registers to know of our updates
         */
        addListener: function(dataProviderListener){
            this.listeners.push(dataProviderListener);
        },
        
        /**
         * Add a data point configuration to our list
         */
        addDataPoint: function(dataPointConfiguration){
            this.pointConfigurations.push(dataPointConfiguration);
        },
};

/**
 * Data Provider Listener
 * @param options
 * @returns
 */
DataProviderListener = function(options){
    for(var i in options) {
        this[i] = options[i];
    }
};

DataProviderListener.prototype = {
        
        /**
         * Called on load of data from provider
         */
        onLoad: function(data, dataPoint){
            
        },
        
        /**
         * Called when data provider asks to clear data
         */
        onClear: function(){
            
        }
};