function narudzbaDostavljac(id, status, restoran) {

    $.ajax({
        url: '/update/narudzba/dostava',
        method: 'PUT',
        data: {
            status: parseInt(status),
            id: parseInt(id),
            restoran: parseInt(restoran)
        },
        success: function () {
            let obj1 = 'uspjeh' + id;
            let obj2 = 'neuspjeh' + id;
            document.getElementById(obj1).style.display = 'none';
            document.getElementById(obj2).style.display = 'none';

            const socket = io('/notifikacija', {transports: ['websocket']});
            socket.emit('notifikacija', {
                    poruka: 'Nova aktivnost dostave',
                    restoran: restoran
                }
            );

        }
    });

}