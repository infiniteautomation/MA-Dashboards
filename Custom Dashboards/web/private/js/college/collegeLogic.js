    /*
    * PLEASE DOC ALL THINGS so that we canb use this as a example later
    * class College JavaScript // fixme naming and what.  
    *setting up the global var for the templater so that we can use in things like listviews and other widgets that are from custom classes
    */
    var templater;
   
   
    /*
    * Fires when the everything is ready to show
    */
   $( document ).ready(function(){


       //Setup Groups
       var meterGroups = new DataPointGroupConfiguration({
           groupBy: 'Folder',
           labelAttribute: 'name',
           matchConfigurations: [{ matchAttribute: 'path', regex: /\/Buildings\/City Plex\/Meters\/*/ }]
           }
       );
       
       
       /**
       * Setting up the Grouper Araary
       */
       var groupConfigurations = new Array();
       
       /**
       * Adding the Meters Group to the COnfig so that it can be passed off to the templater
       */
       groupConfigurations.push(meterGroups);
       
       
       if(groupsListsType == 'select'){
           var groupSelect = new SelectPickerConfiguration('groupsList',{}, {});
       }else{
           /**
            *Create a custom grouper for bootstraps listgroup element
            */
            var groupSelect = new ListViewConfiguration(
             'groupsList', 
             {},

             /*
             * Adding Custom Class tags to the object of the JQuery Mobiles ListView
             */
             {styleClass: "btn"}
             );           
       }
    // setting up the custom date picker format
       var templaterDefaultEndDate = new Date(); //Now
       var templaterDefaultStartDate = new Date(templaterDefaultEndDate.getTime() - 1000*60*60*24);
       /**
       *Setting upo the main Templater and adding all the vars ans what not to the Display
       */
       var templaterConfig = {
               debug: true,
               type: 'PointHierarchy',
               displayConfigurations: displayConfigurations,
               pointConfigurations: pointConfigurations,
               groupConfigurations: groupConfigurations,
               dataProviders: dataProviders,
               groupSelectConfiguration: groupSelect,
               loadGroupAtStartup: 0, //GroupId to load
               startDate: templaterDefaultStartDate,
               endDate: templaterDefaultEndDate,
	       /**
                * Since we want to tie in another display manager 
                * that is already configured we can just 
                * refresh it here.
                */
	       
               groupChanged: function(groupId, templater){
                   if(templater.debug)
                       console.log('GroupChanged: ' + groupId);
                   templater.groupId =  groupId;
                   templater.displayManager.clear(true); //Clear all data  AND Point Configurations on a change of Group
                   var matchedDataPointConfigurations = templater.pointMatcher.match(templater.groups[groupId].dataPoints);
                   templater.refresh(null, templater);
                   
                   //Load in the Name of the Meter
                   $('#meterName').text(templater.groups[groupId].label);
                   
                   //Refresh the other display Manager
                   //Clear out the bar chart for new data
                   kWhDailyBarChartDisplayManager.clear(true);
                   //Ensure we have the new data point configurations from the Match
                   for(var i=0; i<matchedDataPointConfigurations.length; i++){
                       kWhDailyBarChartDisplayManager.addDataPointConfiguration(matchedDataPointConfigurations[i]);
                   }
                   
                   //The kWhBarChartDataProviderSettings are Globally defined in the kWhDailyBarChart.js file
                   kWhDailyBarChartDisplayManager.refresh(null, kWhDailyBarChartDataProviderSettings);
               },
               
              /** 
	       *Setup Custom Formats for Time 
	       */
               startDateConfiguration: new DateTimePickerConfiguration(
                       'startDate', {
                           format: 'm/d Y g a'
                       }, {
                           defaultValue: templaterDefaultStartDate,
                       }),
              endDateConfiguration: new DateTimePickerConfiguration(
                      'endDate', {
                          format: 'm/d Y g a'
                      }, {
                          defaultValue: templaterDefaultEndDate,
                      }),    
               
       }
       
       templater = new DashboardTemplater(templaterConfig);

       
       //TODO Refresh the 4 Mini BarChart Historical Data Providers to load in the last 1 Value
       
   });// End When page Ready
   
        /**
        * Display Errors method
        */
        function showError(jqXHR, textStatus, errorThrown, mangoMessage){
            var msg = "";
            if(textStatus != null)
                msg += (textStatus + " ");
            if(errorThrown != null)
                msg += (errorThrown + " ");
            if(mangoMessage != null)
                msg += (mangoMessage + " ");
            msg += "\n";
            $("#errors").text(msg);
        }

