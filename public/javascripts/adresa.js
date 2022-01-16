window.onload = function() {
    L.mapquest.key = 'FDuNiAQLX9ZvwZbXDXwvizeD36mlUrjK';

    var popup = L.popup();

    var forma = document.getElementById('forma_adresa');

    var map = L.mapquest.map('map', {
        center: [43.856430, 18.413029],
        layers: L.mapquest.tileLayer('map'),
        zoom: 14
    });

    map.addControl(L.mapquest.control());

    map.on('click', function(e) {
        popup.setLatLng(e.latlng).openOn(this);
        L.mapquest.geocoding().reverse(e.latlng, generatePopupContent);
    });

    function generatePopupContent(error, response) {
        var location = response.results[0].locations[0];
        //console.log(location.latLng.lat);
        console.log(location);
        var street = location.street;
        var city = location.adminArea5;
        var state = location.adminArea3;
        popup.setContent(street + ', ' + city + ', ' + state);
        forma.ulica.value = street;
        forma.latituda.value = location.latLng.lat;
        forma.longituda.value = location.latLng.lng;
    }
}