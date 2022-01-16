/*dizajn preuzet sa https://codepen.io/sajadhsm/pen/odaBdd*/

const korisnik_ime = document.getElementById('getIme').value;

var socket = io.connect('ws://localhost:3000', {transports: ['websocket'], upgrade: false});
var admin_zauzet = false;


socket.on('poruka_admin_zauzet', function(d) {
    admin_zauzet = true;
    appendMessage(d.ime, "left", d.poruka, d.vrijeme);
});

socket.on('poruka_sa_servera', function(d) {
    if (admin_zauzet) {
    } else {
        if (d.tip != 0)
            appendMessage(d.ime, "left", d.poruka, d.vrijeme);
    }
});

socket.on('sve_poruke', function(d) {
    if (admin_zauzet) {
        return
    } else {
        for (let i=0; i<d.length; i++) {
            if (d[i].tip == 0)
                appendMessage(d[i].ime, "right", d[i].poruka, d[i].vrijeme);
            else if (d[i].tip != 0)
                appendMessage(d[i].ime, "left", d[i].poruka, d[i].vrijeme);
        }
    }
});


const msgerForm = get(".msger-inputarea");
const msgerInput = get(".msger-input");
const msgerChat = get(".msger-chat");

msgerForm.addEventListener("submit", event => {
    event.preventDefault();

    const tekst = msgerInput.value;
    if (!tekst)
        return;

    appendMessage(korisnik_ime, "right", tekst, formatDate(new Date()));
    msgerInput.value = "";


    if (admin_zauzet) {
        return;
    } else {
        socket.emit('klijent_salje_poruku', {
            poruka: tekst,
            ime: korisnik_ime,
            tip: 0,
            vrijeme: formatDate(new Date())
        });
    }
});

function appendMessage(name, side, text, date) {
    const msgHTML = `
    <div class="msg ${side}-msg">

      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name">${name}</div>
          <div class="msg-info-time">${date}</div>
        </div>

        <div class="msg-text">${text}</div>
      </div>
    </div>
  `;

    msgerChat.insertAdjacentHTML("beforeend", msgHTML);
    msgerChat.scrollTop += 500;
}

function get(selector, root = document) {
    return root.querySelector(selector);
}

function formatDate(date) {
    const h = "0" + date.getHours();
    const m = "0" + date.getMinutes();

    return `${h.slice(-2)}:${m.slice(-2)}`;
}
