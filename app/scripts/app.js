(function() {

  // Strict mode helps out in a couple ways:
  // 1. It catches some common coding bloopers, throwing exceptions.
  // 2. It prevents, or throws errors, when relatively "unsafe" actions are taken 
  // (such as gaining access to the global object).  
  'use strict';

  var app = {
    isLoading: true,
    visibleCards: {},
    preferredLocations: [], 
    // querySelector(), on highest level, returns all the HTML code content defined for class 
    // 'loader' in index.html webpage (document) file & assigns it to the Spinner sub-variable.
    spinner: document.querySelector('.loader'),
    cardTemplate: document.querySelector('.cardTemplate'),
    container: document.querySelector('.main'),
    addDialog: document.querySelector('.dialog-container'),
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  };

  // Setting up toastr Notification  
    toastr.options = {
      "positionClass": "toast-bottom-center",
      "timeOut": "1500"
    }

  /*****************************************************************************
   * Event listeners for UI elements
   ****************************************************************************/

  /* Event listener for refresh button */
  document.getElementById('butRefresh').addEventListener('click', function() {
    // Refreshing the forecasts if forecast cards exists
    if (app.preferredLocations.length == 0) {
        toastr.info('No weather cards to refresh');
    } else {
        app.updateForecasts();
        // Display refresh successful message
        toastr.success('Weather Forecasts Updated');
      }
  });

  /* Event listener for add new city button */
  document.getElementById('butAdd').addEventListener('click', function() {
    // Open/show the add new city dialog
    app.toggleAddDialog(true);  
  });

  /* Implementing the Location Autocomplete feature only if internet connection exists*/  
  if (navigator.onLine) {    
    google.maps.event.addDomListener(window, 'load', function () {
      if (navigator.onLine) {
        new google.maps.places.Autocomplete(document.getElementById('userInput'));        
      }     
    }); 
  } 
    
  /* Event listener for add city button in add city dialog */
  document.getElementById('butAddCity').addEventListener('click', function() {
    // Fetching the newly entered location
    var location = document.getElementById('userInput').value;
    // Setting the Textfield to empty inorder to remove any previous location value.
    document.getElementById('userInput').value = "";
    if(location === "") {
      toastr.error("Please enter a location");
    } 
    else if(app.preferredLocations.indexOf(location) > -1) {
      toastr.info("Location already added");
    } else {    
        // Initializing preferredLocations.
        if (!app.preferredLocations) {
          app.preferredLocations = [];
        }
        // Sending a 'true' parameter inorder to ensure that 'Location added Successfully'
        // message is only shown in such a condition and not during card refresh situation.
        app.getForecast(location,true);      
      }  
  });

  /* Event listener for cancel button in add city dialog */
  document.getElementById('butAddCancel').addEventListener('click', function() {
    // Close the add new city dialog
    app.toggleAddDialog(false);
    // Setting the Textfield to empty inorder to remove any partially typed location value
    // which was neither added nor removed from textfield by the user.
    document.getElementById('userInput').value = "";
    // Make spinner visible if a cancel button of AddCity Dialog is clicked and user has 
    // not entered any location ie. the app comes back to its default Loading state.
    if(app.isLoading){
      app.spinner.removeAttribute('hidden');
    }

  });


  /*****************************************************************************
   * Methods to update/refresh the UI
   ****************************************************************************/

  // Toggles the visibility of the add new city dialog.
  app.toggleAddDialog = function(visible) {
    if (visible) {
      // The classList property in this case is useful to add, remove and 'toggle' 
      // CSS classes in the HTML code class list defined inside <div class="dialog-container"> 
      // tag in index.html . Here the addition of dialog-container--visible class indirectly 
      // applies its related CSS properties which makes the addDialog (having class 
      // "dialog-container") visible & gives the'+'(AddCity) button the sense to respond 
      // to the the touch events.    
      app.addDialog.classList.add('dialog-container--visible');
      // Hide the Spinner
      app.spinner.setAttribute('hidden', true);
    } else {
      app.addDialog.classList.remove('dialog-container--visible');
    }
  };
  
  // Updates a weather card with the latest weather forecast. If the card
  // doesn't already exist, it's cloned from the template.
  // 'data', is the API response.  
  app.updateForecastCard = function(data) { 
    // Here, dataLastUpdated is used to track the time when the data was last created 
    // for a particular city on the API cloud from where responses are fetched.   
    // Date() converts the API response into desired format.
    var dataLastUpdated = new Date(data.created);
    var sunrise = data.channel.astronomy.sunrise;
    var sunset = data.channel.astronomy.sunset;
    var current = data.channel.item.condition;
    var humidity = data.channel.atmosphere.humidity;
    var wind = data.channel.wind;
    // if card already exists, then add all HTML code structure along with prev values for a 
    // location in visibleCards with name same as data.location ie particluar location will 
    // be loaded into the card variable.  
    var card = app.visibleCards[data.location];
    
    if (!card) {
      // cloneNode creates a copy of node from HTML Structure of app.cardTemplate 
      // and returns the clone.
      card = app.cardTemplate.cloneNode(true);
      // Removed, as cardTemplate is no longer required in classList of HTML code of Card Element 
      card.classList.remove('cardTemplate');
      card.querySelector('.location').textContent = data.location;
      card.removeAttribute('hidden');
      app.container.appendChild(card);
      app.visibleCards[data.location] = card;
      // example of visibleCards variable after the above line is executed below- 
      // {austin: div.card.weather-forecast, boston: div.card.weather-forecast}
      // data.location defines the 'location' by which 'value'(ie HTML Code of Card) should be 
      // stored inside variable visibleCards.
    }

    /**
     * Verifies the data provide is newer than what's already visible
     * on the card and then update the card accordingly.
     **/
    var cardLastUpdatedElem = card.querySelector('.card-last-updated');
    // will be null, during first time, the card is added into the list of forecast cards.  
    // will hold a value, the next time onwards the card is refreshed to fetch new updates.  
    var cardLastUpdated = cardLastUpdatedElem.textContent;
    if (cardLastUpdated) {
      cardLastUpdated = new Date(cardLastUpdated);
      // Do Nothing, if the card has more recent data then the data that was last fetched
      // from Yahoo Weather Cloud.
      if (dataLastUpdated.getTime() < cardLastUpdated.getTime()) {
        return;
      }
    }    
    cardLastUpdatedElem.textContent = data.created;
    // Alternative for above statement: card.querySelector('.card-last-updated').textContent = data.created;

    // Setting the values for textContent in card by fetching respective values 
    // from server response.  
    card.querySelector('.description').textContent = current.text;
    card.querySelector('.date').textContent = current.date;
    // appending the required CSS class to include the icon of current weather condition.
    // current.code contains the code value response sent by API for each weather type 
    // and getIconClass() (user defined fucntion) returns the equivalent weather type 
    // for a code passed to it which inturn acts as the CSS class for that weather type too.
    // eg : card.querySelector('.current .icon').classList.add("windy"); where 
    // app.getIconClass returns 'windy' for that respective current.code       
    card.querySelector('.current .icon').classList.add(app.getIconClass(current.code));    
    card.querySelector('.current .visual .celcius-temperature .value').textContent =
      Math.round(current.temp);
    card.querySelector('.current .visual .fahrenheit-temperature .fahrenheit-value').textContent =
      Math.round((current.temp*1.8)+32);
    card.querySelector('.current .sunrise').textContent = sunrise;
    card.querySelector('.current .sunset').textContent = sunset;
    card.querySelector('.current .humidity').textContent =
      Math.round(humidity) + '%';
    card.querySelector('.current .wind .value').textContent =
      Math.round(wind.speed);
    card.querySelector('.current .wind .direction').textContent = wind.direction;      
    var nextDays = card.querySelectorAll('.future .oneday');
    var today = new Date();
    // returns a numeric value for day of week starting from Sunday as 0 & so on.
    today = today.getDay();
    // Displaying weather details for next 7 days.
    for (var i = 0; i < 7; i++) {
      // Injecting the HTML code for a displaying a particular day into nextDay variable.
      var nextDay = nextDays[i];
      // Fetching Daily weather details for each of next day in each iteration.
      var daily = data.channel.item.forecast[i];
      // if both fields are non-empty, then write the weather details.
      if (daily && nextDay) {
        // Displaying the Next Day label with respective Day.
        nextDay.querySelector('.date').textContent =
          app.daysOfWeek[(i + today) % 7];
        // The below statement add a class to the classList to make a corresponding 
        // CSS Class. eg: .icon + (daily.icon : say rain), makes the CSS class .icon.rain
        // which then displays the required image as mentioned in CSS code.
        nextDay.querySelector('.icon').classList.add(app.getIconClass(daily.code));      
        nextDay.querySelector('.temp-high .value').textContent =
          Math.round(daily.high);
        nextDay.querySelector('.temp-low .value').textContent =
          Math.round(daily.low);
      };
    }
    // Hide the Loading spinner when the first forecast card ever, is done loading with details.
    if (app.isLoading) {
      app.spinner.setAttribute('hidden', true);
      app.container.removeAttribute('hidden');
      app.isLoading = false;
    }
  };

  /*****************************************************************************
   * Methods for dealing with the model
   ****************************************************************************/

  /*
   * Gets a forecast for a specific location and updates the card with the data.
   * getForecast() first checks if the weather data is in the cache. If so,
   * then it gets that data and populates the card with the cached data.
   * Then, getForecast() goes to the network for fresh data. If the network
   * request goes through, then the card gets updated a second time with the
   * freshest data.
   * @param Location : location entered by User.
   * @param callFromAddCityDialog : to determine the component which called the method
   * inorder to display appropriate user message. 
   */
  
  app.getForecast = function(location, callFromAddCityDialog) {
    // Details: https://developer.yahoo.com/weather/ 
    var statement = "select * from weather.forecast where woeid in" + 
                    "(select woeid from geo.places(1) where text='" + location + "') and u='c'";
    var url = 'https://query.yahooapis.com/v1/public/yql?format=json&q=' + statement;
    // Fetch the latest data.
    // Make the XHR to get the data, then update the card
    var request = new XMLHttpRequest();
    request.open('GET', url);
    request.send();
    // Proceed when any changes takes place in state of client while comunicating with server.
    // May be called multiple times.
    request.onreadystatechange = function() {
      // "===" means equality in both value and datatype of value.
      // eg: 1=="1" returns true, due to auto type conversion (typecasting).
      // 1==="1" returns false, because they are of a different type before typecasting.
      // XMLHttpRequest.DONE means that opeartion of downloading data from server is complete.
      
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          var response = JSON.parse(request.response);   
          // Fetching results from desired attribute in API response. 
          var results = response.query.results;
          // alerting user for invalid location        
          if (!results) {
            toastr.error("Looks like an incorrect location");
            return;
          } else {
              // Adding a new attribute location in results so as to use it later to fill the 
              // Location entry in the card by referencing it ie. data.location
              // Note: We can define any new field to results eg: results.example = "PWA"; 
              results.location = location;
              results.created = response.query.created;
              app.updateForecastCard(results);
              if(callFromAddCityDialog) { 
                toastr.success("Location Successfully Added"); 
                app.toggleAddDialog(false);  
              }
              // Adding the new location into user preferences of locations for which user needs 
              // to get weather details only if its not duplicate.
              if(app.preferredLocations.indexOf(location) === -1) { 
                app.preferredLocations.push(location);
                app.savePreferredLocations(); 
              }
            }  
        } 
      } 
    }; 
  };

  // Iterate all of the cards and attempt to get the latest forecast data
  app.updateForecasts = function() {
    // Object.keys() returns an array of key of each element associated 
    // with the object passed as argument (ie. app.visibleCards) to it. 
    // Eg: Contents of key array would be [ 'Location1', 'Location2'....] 
    var keys = Object.keys(app.visibleCards);
    keys.forEach(function(location) {
      app.getForecast(location);
    });
  };

  app.getIconClass = function(weatherCode) {
    // Weather codes: https://developer.yahoo.com/weather/documentation.html#codes
    weatherCode = parseInt(weatherCode);
    switch (weatherCode) {
      case 25: // cold;
      case 32: // sunny
      case 33: // fair (night)
      case 34: // fair (day)
      case 36: // hot
      case 3200: // not available
        return 'clear-day';
      case 0: // tornado
      case 1: // tropical storm
      case 2: // hurricane
      case 6: // mixed rain and sleet
      case 8: // freezing drizzle
      case 9: // drizzle
      case 10: // freezing rain
      case 11: // showers
      case 12: // showers
      case 17: // hail
      case 35: // mixed rain and hail
      case 40: // scattered showers
        return 'rain';
      case 3: // severe thunderstorms
      case 4: // thunderstorms
      case 37: // isolated thunderstorms
      case 38: // scattered thunderstorms
      case 39: // scattered thunderstorms (not a typo)
      case 45: // thundershowers
      case 47: // isolated thundershowers
        return 'thunderstorms';
      case 5: // mixed rain and snow
      case 7: // mixed snow and sleet
      case 13: // snow flurries
      case 14: // light snow showers
      case 16: // snow
      case 18: // sleet
      case 41: // heavy snow
      case 42: // scattered snow showers
      case 43: // heavy snow
      case 46: // snow showers
        return 'snow';
      case 15: // blowing snow
      case 19: // dust
      case 20: // foggy
      case 21: // haze
      case 22: // smoky
        return 'fog';
      case 24: // windy
      case 23: // blustery
        return 'windy';
      case 26: // cloudy
      case 27: // mostly cloudy (night)
      case 28: // mostly cloudy (day)
      case 31: // clear (night)
        return 'cloudy';
      case 29: // partly cloudy (night)
      case 30: // partly cloudy (day)
      case 44: // partly cloudy
        return 'partly-cloudy-day';
    }
  };

/************************************************************************
   * Code required to start the app
   * NOTE: Here, initially we used localStorage, which we later changed because:
   *   localStorage is a synchronous API and has serious performance
   *   issues and also localStorage is a non-transactional storage meaning it does 
   *   not implements ACID properties. Hence, It should not be used in production applications!
   *   Instead, we choose to store data in IndexedDB sort of implementation by using LocalForage.  
   ************************************************************************/
  
  // Save list of locations using LocalForage.
  app.savePreferredLocations = function() {
  // IndexedDb has too many callbacks and is bit complex to be implemented raw. 
  // Hence, we prefer using localForage which is a fast and simple storage library 
  // for JavaScript. localForage improves the offline experience of web app by using 
  // asynchronous storage (IndexedDB or WebSQL) with a simple, localStorage-like API.
  // It acts as a wrapper around IndexedDb and helps to use IndexedDb easily & value is 
  // stored in a key-value pair format. It also stores data in Javascript object format, hence no need to convert Javascript 
  // object into strings during saving or vice versa. 
  // 'window' object represents an open window in a browser. 
    window.localforage.setItem('preferredLocations',app.preferredLocations);
  };

    // err to instantiate an error object inroder to throw any runtime error.
    // 'preferredLocations' passed as 'LocationList'
    window.localforage.getItem('preferredLocations', function(err, locationList) {
      if (locationList) {
        // No need to use JSON.parse() as data is fetched from LocalForage in String format.
        app.preferredLocations = locationList;
        app.preferredLocations.forEach(function(location) {
          app.getForecast(location);
        });
      }    
    });
   
    /* Every time the app is accessed, user's locations has to be saved using IP lookup 
     * and then injecting that data into the page.
     */
     // TODO: Add & modify the below Code for fetching the current location of user and 
     // displaying the forecast card accordingly. 
    
    /* 
    app.updateForecastCard(initialWeatherForecast);
    app.preferredLocations = [
      { //add preferred location here.
      }
    ];
    app.savePreferredLocations();
    */


  // Checking if the browser supports service workers and registering if it does. 
  if ('serviceWorker' in navigator) {
  // Delay registration until after the page has loaded, to ensure that our
  // precaching requests don't degrade the first visit experience.
  // See https://developers.google.com/web/fundamentals/instant-and-offline/service-worker/registration
  window.addEventListener('load', function() {
    // Your service-worker.js *must* be located at the top-level directory relative to your site.
    // It won't be able to control pages unless it's located at the same level or higher than them.
    // *Don't* register service worker file in, e.g., a scripts/ sub-directory!
    // See https://github.com/slightlyoff/ServiceWorker/issues/468
    navigator.serviceWorker.register('./sw.js').then(function(reg) {
      // updatefound is fired if service-worker.js changes.
      reg.onupdatefound = function() {
        // The updatefound event implies that reg.installing is set; see
        // https://w3c.github.io/ServiceWorker/#service-worker-registration-updatefound-event
        var installingWorker = reg.installing;

        installingWorker.onstatechange = function() {
          switch (installingWorker.state) {
            case 'installed':
              if (navigator.serviceWorker.controller) {
                // At this point, the old content will have been purged and the fresh content will
                // have been added to the cache.
                // It's the perfect time to display a "New content is available; please refresh."
                // message in the page's interface.
                console.log('New or updated content is available.');
              } else {
                // At this point, everything has been precached.
                // It's the perfect time to display a "Content is cached for offline use." message.
                console.log('Content is now available offline!');
              }
              break;

            case 'redundant':
              console.error('The installing service worker became redundant.');
              break;
          }
        };
      };
    }).catch(function(e) {
      console.error('Error during service worker registration:', e);
      });
  });
  }
})();

