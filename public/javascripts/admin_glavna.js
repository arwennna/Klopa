const socket = io('/notifikacija', {transports: ['websocket']});
socket.on('notifikacija_sa_servera', function(d) {
    let restoran = document.getElementById('getRestoran').value;
    if (d.restoran == restoran) {
        var myModal = new bootstrap.Modal(document.getElementById('myModal'));
        myModal.show();
    }
});