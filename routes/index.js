var express = require('express');
var router = express.Router();

//--------------------------------------------------Konfiguracija-----------------------------------------------------//

var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'klopa.user1@gmail.com',
    pass: 'Administracija!123'
  },
  tls: {
    rejectUnauthorized: false
  }
});

const naslov = "KLOPA";

var bcrypt = require('bcrypt');
var passport = require('passport');
var pool = require('../konfig/konfig_baza');

var inicijaliziraj = require('../konfig/konfig_passport');
inicijaliziraj(passport);

var {
  jeste_autentificiran,
  nije_autentificiran,
  ima_adresu,
  chat,
  super_admin,
  admin,
  formatirajDatum} = require('../funkcije/pomocne');

var io = null;

var Twitter = require('twitter');
var twitterClient = new Twitter({
  access_token_key: '1423307340070141954-ZF3STvH2GBr791EaNqzdHk3WEtNUFd',
  access_token_secret: 'zTfluJAYGkjT8SHbmMlF8nI9rSthRnQ2sy4YXmZK3JJJQ',
  consumer_key: 'J27z7w29AL73qMgQEThiN4kRt',
  consumer_secret: 'OSI7RbO8BCoDH2dX4mmWWEW7tB1XtGf83cdvcF8Wj8AGT9y1Do'
});

//--------------------------------------------------Index-------------------------------------------------------------//

router.get('/', jeste_autentificiran, function(req, res, next) {
  res.render('index.ejs', { title: naslov });
});

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Prijava get-------------------------------------------------------//

router.get('/prijava', jeste_autentificiran, function(req, res, next) {
  res.render('auth/prijava.ejs', { title: naslov });
});

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Prijava post------------------------------------------------------//

router.post('/prijava', passport.authenticate('local', {
      successRedirect: '/glavna',
      failureRedirect: '/prijava',
      failureFlash: true
    }), function(req, res, next) {
      console.log(req.user);
    }
);

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Registracija get--------------------------------------------------//

router.get('/registracija', jeste_autentificiran, function(req, res, next) {
  res.render('auth/registracija.ejs', { title: naslov });
});

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Registracija post-------------------------------------------------//

router.post('/registracija', async function(req, res, next) {
  let ime = req.body.name;
  let prezime = req.body.lname;
  let mail = req.body.email;
  let sifra = req.body.password;
  let sifra2 = req.body.password2;

  let errors = [];
  if (!ime || !prezime || !mail || !sifra || !sifra2) {
    errors.push({message: "Molimo, unesite potpune podatke!"});
  }
  if (sifra != sifra2) {
    errors.push({message: "Pogrešna potvrda šifre."});
  }
  if (sifra.length < 6) {
    errors.push({message: "Šifra se treba sastojati barem od 6 karaktera."});
  }
  if (errors.length > 0) {
    res.render('auth/registracija.ejs', { title: naslov, errors });
  } else {
    let kriptovana_sifra = await bcrypt.hash(sifra, 10);

    pool.connect(function (err, client, done) {
      if (err) {
        res.end('{"error" : "Error", "status" : 500}');
      }
      client.query(`SELECT * FROM korisnik WHERE korisnik_mail = $1`, [mail], function(err, result) {
        done();
        if (err) {
          console.info(err);
          res.sendStatus(500);
        } else {
          if (result.rows.length > 0) {
            errors.push({message: "Korisnik sa ovim mailom već postoji."});
            res.render('auth/registracija.ejs', { title: naslov, errors })
          } else {
            pool.connect(function (err, client, done) {
              client.query(`INSERT INTO korisnik (korisnik_ime, korisnik_prezime, korisnik_sifra, korisnik_mail) 
              VALUES ($1, $2, $3, $4);`, [ime, prezime, kriptovana_sifra, mail], function (err, results) {
                done();
                if (err) {
                  console.info(err);
                  res.sendStatus(500);
                }
                req.flash("success_msg", "Uspješno ste registrovani. Molimo, logujte se");
                res.redirect('/prijava');
              });
            });
          }
        }
      });
    });
  }
});

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Odjava------------------------------------------------------------//

router.get('/odjava', nije_autentificiran, function (req, res, next) {
  req.logout();
  res.redirect('/prijava');
});

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Profil------------------------------------------------------------//

router.get('/mojprofil', nije_autentificiran, function(req, res, next) {
  res.render('auth/moj_profil.ejs', {korisnik: req.user, title: naslov});
});

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Profil (update adrese)--------------------------------------------//

router.post('/mojprofil', nije_autentificiran, async function(req, res, next) {

  let ulica = req.body.ulica;
  let latituda = req.body.latituda;
  let longituda = req.body.longituda;

  let usr = req.user.korisnik_id;

  pool.connect(function(err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`UPDATE korisnik
                  SET
                      korisnik_lat = $1,
                      korisnik_long = $2,
                      korisnik_ulica = $3
                  WHERE
                       korisnik_id = $4;
                  `, [latituda, longituda, ulica, usr], function(err, result) {
      done();
      if (err) {
        console.info(err);
        res.sendStatus(500);
      } else {
        res.redirect('/mojprofil');
      }
    });
  });
});

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Unos adrese-------------------------------------------------------//

router.get('/adresa', nije_autentificiran, ima_adresu, function(req, res, next) {
  res.render('auth/adresa.ejs', {korisnik: req.user, title: naslov});
});

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Chat--------------------------------------------------------------//

var poruke = [];
var idevi = [];
var pocetakKonverzacijeAdmin = true;
var pocetakKonverzacijeKupac = true;

router.get('/chat', nije_autentificiran, chat, function(req, res, next) {
  idevi.push({
    ime: req.user.korisnik_ime,
    tip: req.user.korisnik_tip,
    id_baza: req.user.korisnik_id,
  });
  if (!io) {
    io = req.app.get('socketio');
    const chatNamespace = io.of('/');
    chatNamespace.on('connection', function(client) {
      idevi[idevi.length-1].id_socket = client.id;
      //Ako se konektuje kupac i vec postoji kupac u tom chatu, različit od trenutnog, tada mu šaljemo poruku da je
      //admin trenutno zauzet, te da pokuša kasnije ponovo.
      if (idevi[idevi.length-1].tip == 4) {
        for (let i=0; i<idevi.length-1; i++) {
          if (idevi[i].id_baza != idevi[idevi.length-1].id_baza && idevi[i].tip == 4) {
            console.log('zauzet');
            chatNamespace.to(client.id).emit('poruka_admin_zauzet', {
              poruka: 'Administrator je trenutno zauzet. Molimo, pokušajte stupiti u kontakt sa njim kasnije.',
              ime: 'Admin',
              vrijeme: '',
              tip: 1
            });
            idevi = idevi.filter(i => i.id_socket !== client.id);
            console.log(idevi);
          }
        }
      }

      console.log(idevi);

      //Ako su provjere prošle:
      if (idevi[idevi.length-1].tip == 4) {
        if (pocetakKonverzacijeAdmin) {
          client.emit('sve_poruke', poruke);
        }
      } else if (idevi[idevi.length-1].tip == 1) {

        if (!pocetakKonverzacijeKupac) {
          client.emit('sve_poruke', poruke);
        }

        for (let i=0; i<idevi.length-1; i++) {
            if (pocetakKonverzacijeKupac) {
              let osoba = idevi[i].ime;

              poruka = 'Pozdrav, ' + osoba + '! Hvala na korištenju naše aplikacije. Kako Vam možemo pomoći?';
              poruke.push({
                poruka: poruka,
                ime: 'Admin',
                tip: 1,
                vrijeme: ''
              });

              chatNamespace.emit('poruka_sa_servera', {
                poruka: poruka,
                ime: 'Admin',
                tip: 2,
                vrijeme: ''
              });
              pocetakKonverzacijeKupac = false;
            }
          }

      }

      client.on('klijent_salje_poruku', function(d) {
        poruke.push(d);
        io.emit('poruka_sa_servera', d);
      });

      client.on('disconnect', function() {
        idevi = idevi.filter(i => i.id_socket !== client.id);

        let adminPomocna = idevi.filter(i => i.tip == 1);
        let kupacPomocna = idevi.filter(i => i.tip == 4);

        //Resetovanje poruka ukoliko su oba učesnika izašla iz konverzacije.
        if (!adminPomocna.length && !kupacPomocna.length) {
          console.log("Reset!");
          pocetakKonverzacijeKupac = true;
          pocetakKonverzacijeAdmin = true;
          poruke = [];
        }

        console.log('Diskonektovan!');
      });

    });
  }

  if (req.user.korisnik_tip == 1) {
    res.render('superadmin/superadmin_chat.ejs', {korisnik: req.user, title: naslov});
  } else if (req.user.korisnik_tip == 4) {
    res.render('kupac/kupac_chat.ejs', {korisnik: req.user, title: naslov});
  }
});

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Pregled narudžbi na mapi------------------------------------------//

router.get('/narudzbe/pregled', nije_autentificiran, super_admin, function(req, res, next) {
  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`SELECT * FROM narudzba
                    INNER JOIN restoran on restoran_id = narudzba_restoran
                    INNER JOIN korisnik k1 on k1.korisnik_id = narudzba_dostavljac
                    INNER JOIN korisnik k2 on k2.korisnik_id = narudzba_kupac
                    WHERE narudzba_datum = CURRENT_DATE;`, [], function(err, result) {
      done();
      if (err) {
        console.info(err);
        res.sendStatus(500);
      } else {
        pool.connect(function (err, client, done) {
          if (err) {
            res.end('{"error" : "Error", "status" : 500}');
          }
          client.query(`SELECT korisnik_id, korisnik_ime, korisnik_prezime FROM korisnik
                    WHERE korisnik_tip = 3;`, [], function(err, results) {
            done();
            if (err) {
              console.info(err);
              res.sendStatus(500);
            } else {
              res.render('superadmin/superadmin_narudzbe_mapa.ejs', {korisnik: req.user, title: naslov, narudzbe: result.rows, narudzbe_dostavljaci: results.rows});
            }
          });
        });
      }
    });
  });
});
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Slanje izvještaja adminu restorana--------------------------------//

router.get('/izvjestaj/admin', nije_autentificiran, admin, function(req, res, next) {

  let mail = req.user.korisnik_mail;
  let admin = req.user.korisnik_ime + ' ' + req.user.korisnik_prezime;
  let admin_id = req.user.korisnik_id;

  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`SELECT restoran_id FROM restoran
                    WHERE restoran_admin = $1;`, [admin_id], function(err, resultsss) {
      done();
      if (err) {
        console.info(err);
        res.sendStatus(500);
      } else {
        let restoran = resultsss.rows[0].restoran_id;

        pool.connect(function(err, client, done) {
          if (err) {
            res.end('{"error" : "Error", "status" : 500}');
          }
          client.query(`SELECT narudzba_datum, COUNT(narudzba_datum) as broj_narudzbi FROM narudzba 
                  WHERE extract (month FROM narudzba_datum) = extract (month FROM CURRENT_DATE)
                  AND narudzba_restoran = $1
                  GROUP BY narudzba_datum;`,
              [restoran], function(err, result) {
                done();
                if (err) {
                  console.info(err);
                  res.sendStatus(500);
                } else {
                  let total = 0;
                  let totalProfit = 0;
                  let narudzbe = result.rows;
                  for (let i=0; i<narudzbe.length; i++) {
                    total += parseInt(narudzbe[i].broj_narudzbi);
                  }
                  let datum = new Date();
                  let mjesec = datum.getMonth() + 1;

                  let message = (
                      '<h2>Izvještaj za ' + mjesec +'. mjesec.</h2>' +
                      '<h2>Administrator: ' + admin + '</h2>' +
                      '<h2>Ukupno narudžbi: ' + total + '</h2>' +
                      '<h3>Pregled po danima: </h3>' +
                      '<table>' +
                      '<thead>' +
                      '<th> Datum </th>' +
                      '<th> Broj narudžbi </th>'  +
                      '</thead>'
                  );

                  for(const { broj_narudzbi, narudzba_datum } of narudzbe) {
                    message += (
                        '<tr>' +
                        '<td>' + formatirajDatum(narudzba_datum) + '</td>' +
                        '<td>' + broj_narudzbi + '</td>' +
                        '</tr>'
                    );
                  }

                  message +=  '</table>';

                  let mailOptions = {
                    from: 'klopa.user1@gmail.com',
                    to: mail,
                    subject: 'Klopa - mjesečni izvještaj',
                    text: 'Izvještaj',
                    html: message
                  };

                  transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                      console.log(error);
                    } else {
                      res.render('admin/admin_izvjestaj.ejs', {title: naslov, narudzbe: narudzbe, admin: admin, mjesec: mjesec, total: total});
                    }
                  });
                }
              });
        });
      }
    });
  });


});

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Slanje izvještaja superadminu-------------------------------------//

router.get('/izvjestaj/superadmin', nije_autentificiran, super_admin, function(req, res, next) {

  let mail = req.user.korisnik_mail;
  let admin = req.user.korisnik_ime + ' ' + req.user.korisnik_prezime;

  pool.connect(function(err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`SELECT COUNT(narudzba) as broj_narudzbi, SUM(narudzba_cijena) as cijena_narudzbi, restoran_naziv
                  FROM narudzba
                  INNER JOIN restoran ON restoran.restoran_id = narudzba_restoran 
                  GROUP BY narudzba_restoran, restoran_naziv;`,
        [], function(err, result) {
          done();
          if (err) {
            console.info(err);
            res.sendStatus(500);
          } else {
            let narudzbe = result.rows;
            pool.connect(function(err, client, done) {
              if (err) {
                res.end('{"error" : "Error", "status" : 500}');
              }
              client.query(`SELECT COUNT(narudzba) as broj_narudzbi_dostavljac, korisnik_ime, korisnik_prezime
                            FROM narudzba
                            INNER JOIN korisnik ON korisnik.korisnik_id = narudzba_dostavljac
                            GROUP BY narudzba_dostavljac, korisnik_ime, korisnik_prezime;`,
                  [], function(err, results) {
                    done();
                    if (err) {
                      console.info(err);
                      res.sendStatus(500);
                    } else {
                      let narudzbe_dostavljac = results.rows;

                      let datum = new Date();
                      let mjesec = datum.getMonth() + 1;

                      let message = (
                          '<h1>Klopa.ba</h1>' +
                          '<h2>Izvještaj za ' + mjesec +'. mjesec:</h2>' +
                          '<h2>Administrator: ' + admin + '</h2>' +
                          '<h3>Pregled po restoranima: </h3>' +
                          '<table>' +
                          '<thead>' +
                          '<th> Restoran </th>' +
                          '<th> Broj narudžbi </th>'  +
                          '<th> Profit </th>'  +
                          '</thead>'
                      );

                      for(const { broj_narudzbi, cijena_narudzbi, restoran_naziv } of narudzbe) {
                        message += (
                            '<tr>' +
                            '<td>' + restoran_naziv + '</td>' +
                            '<td>' + broj_narudzbi + '</td>' +
                            '<td>' + cijena_narudzbi + ' KM</td>' +
                            '</tr>'
                        );
                      }

                      message +=  '</table>';

                      message +=
                          '<h4>Rad dostavljača u ' + mjesec +'. mjesecu:</h4>' +
                          '<table>' +
                          '<thead>' +
                          '<th> Dostavljač </th>' +
                          '<th> Broj narudžbi </th>'  +
                          '</thead>'

                      for(const { broj_narudzbi_dostavljac, korisnik_ime, korisnik_prezime } of narudzbe_dostavljac) {
                        message += (
                            '<tr>' +
                            '<td>' + korisnik_ime + ' ' + korisnik_prezime +  '</td>' +
                            '<td>' + broj_narudzbi_dostavljac + '</td>' +
                            '</tr>'
                        );
                      }

                      message +=  '</table>';

                      let mailOptions = {
                        from: 'klopa.user1@gmail.com',
                        to: mail,
                        subject: 'Klopa - mjesečni izvještaj',
                        text: 'Izvještaj',
                        html: message
                      };

                      transporter.sendMail(mailOptions, function(error, info){
                        if (error) {
                          console.log(error);
                        } else {
                          res.render('superadmin/superadmin_izvjestaj.ejs', {title: naslov, mjesec: mjesec,
                          narudzbe: narudzbe, narudzbe_dostavljac: narudzbe_dostavljac});
                        }
                      });
                    }
                  });
            });
          }
        });
  });
});

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Postavljanje novog tweeta-----------------------------------------//

router.post('/tweet', nije_autentificiran, super_admin, function(req, res, next) {

  let tekst = req.body.sadrzaj;

  twitterClient.post('statuses/update', {status: tekst})
      .then(function (tweet) {
        res.sendStatus(200);
      })
      .catch(function (error) {
        throw error;
      });
});

//--------------------------------------------------------------------------------------------------------------------//

module.exports = router;
