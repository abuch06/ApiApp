$(document).ready(function() {

  /*
  var csv_data;
  $.get('data/data_names.csv', function(data) {
    csv_data = data;
  }, 'text');
  var data_names = $.parse(csv_data,  userConfig());
  */

  var census_api_root = "http://api.bls.gov/publicAPI/v1/timeseries/data/";
  var census_api_prefix = "CE";
  var census_api_season = "U";
  var census_api_indust = "08000000";
  var census_api_data = "03";
  var census_api_string = census_api_root + census_api_prefix + census_api_season + census_api_indust + census_api_data;

/*
  $.get(census_api_string, function(data) {
    $('#main').text(JSON.stringify(json, undefined, 2));
  });
*/
  var updatePage = function( resp ) {
    $( '#temp').text( resp.length() );
  };
  var printError = function( req, status, err ) {
    $( '#temp').text( err );
    console.log( 'something went wrong', status, err );
  };

  var ajaxOptions = {
    url: census_api_string,
    contentType: 'text/plain',
    dataType: 'jsonp',
    success: updatePage,
    error: printError
  };

  $.ajax(ajaxOptions);

  //$('#temp').text('SOMETHING');

/*

    function userConfig() 
    {
        return {
            delimiter: ",",
            header: true,
            dynamicTyping: true,
        };
    }
*/
});
