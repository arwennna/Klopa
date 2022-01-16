window.onload = function() {
    L.mapquest.key = 'FDuNiAQLX9ZvwZbXDXwvizeD36mlUrjK';

    var popup = L.popup();

    var forma = document.getElementById('forma_create_restoran');

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


function obrisiRestoran(id){
    $.ajax({
        url: '/delete/restoran/' + id,
        method: 'DELETE',
        success: function () {
            str = 'red' + id;
            str2 = 'opcija' + id;
            var za_brisanje = document.getElementById(str);
            var za_brisanje2 = document.getElementById(str2);
            za_brisanje.remove();
            za_brisanje2.remove();
        }
    });
}

function obrisiTipRestorana(id){
    $.ajax({
        url: '/delete/restoran/tip/' + id,
        method: 'DELETE',
        success: function () {
            str = 'restorani_tip' + id;
            var za_brisanje = document.getElementById(str);
            za_brisanje.remove();
        }
    });
}

function izmijeniTipRestorana(id){
    str = 'input' + id;
    novi_tip = document.getElementById(str).value;
    $.ajax({
        url: '/update/restoran/tip/' + id,
        method: 'PUT',
        data: {novi_tip_naziv: novi_tip},
        success: function () {
            zapis = 'val' + id;
            document.getElementById(str).value = '';
            console.log(zapis);
            console.log(document.getElementById(zapis).value);
            document.getElementById(zapis).innerHTML = novi_tip;
        }
    });
}

function obrisiTipArtikla(id){
    $.ajax({
        url: '/delete/artikal/tip/' + id,
        method: 'DELETE',
        success: function () {
            str = 'artikli_tip' + id;
            var za_brisanje = document.getElementById(str);
            za_brisanje.remove();
        }
    });
}

function izmijeniTipArtikla(id){
    str = 'input_artikal_tip' + id;
    novi_tip = document.getElementById(str).value;
    $.ajax({
        url: '/update/artikal/tip/' + id,
        method: 'PUT',
        data: {novi_tip_naziv: novi_tip},
        success: function () {
            zapis = 'val_artikal_tip' + id;
            document.getElementById(str).value = '';
            console.log(zapis);
            console.log(document.getElementById(zapis).value);
            document.getElementById(zapis).innerHTML = novi_tip;
        }
    });
}


