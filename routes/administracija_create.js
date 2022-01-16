var express = require('express');
var router = express.Router();

var express = require('express');
var router = express.Router();

var multer = require('multer');
var path = require('path');

//--------------------------------------------------Konfiguracija-----------------------------------------------------//

const naslov = "KLOPA";

var bcrypt = require('bcrypt');
var passport = require('passport');
var pool = require('../konfig/konfig_baza');

var inicijaliziraj = require('../konfig/konfig_passport');
inicijaliziraj(passport);

var {
  nije_autentificiran,
  super_admin,
  admin,
  adminplus} = require('../funkcije/pomocne');

//--------------------------------------------------Upload slika------------------------------------------------------//

const storage = multer.diskStorage({
  destination: './public/images/',
  filename: function(req, file, cb){
    cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits:{fileSize: 1000000},
  fileFilter: function(req, file, cb){
    checkFileType(file, cb);
  }
}).single('myImage');

function checkFileType(file, cb){
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if(mimetype && extname){
    return cb(null,true);
  } else {
    cb('Error: Images Only!');
  }
}

//--------------------------------------------------Restoran----------------------------------------------------------//

router.post('/restoran', nije_autentificiran, super_admin, upload, async function(req, res, next) {

  let ime = req.body.ime;
  let tip = req.body.tipRestorana;
  let ulica = req.body.ulica;
  let latituda = req.body.latituda;
  let longituda = req.body.longituda;
  let ocjena = req.body.ocjena;
  let slika = req.file.filename;

  pool.connect(function(err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`INSERT INTO restoran (restoran_naziv, restoran_tip, restoran_ulica, restoran_lat, 
                                        restoran_long, restoran_ocjena, restoran_slika)
                                VALUES ($1, $2, $3, $4, $5, $6, $7)
                  `, [ime, tip, ulica, latituda, longituda, ocjena, slika], function(err, result) {
      done();
      if (err) {
        console.info(err);
        res.sendStatus(500);
      } else {
        //console.info(result);
        res.redirect('/administracija/restorani');
      }
    });
  });
});

//--------------------------------------------------Admin-------------------------------------------------------------//

router.post('/admin', nije_autentificiran, super_admin, async function(req, res, next) {

  let ime = req.body.ime;
  let prezime = req.body.prezime;
  let mail = req.body.mail;
  let sifra = req.body.sifra;
  let tip = 2;
  let restoran = req.body.restoran;

  let errors = [];

  if (sifra.length < 6) {
    errors.push({message: "Šifra se treba sastojati barem od 6 karaktera."});
  }

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
          pool.connect(function(err, client, done) {
            if (err) {
              res.end('{"error" : "Error", "status" : 500}');
            }
            client.query(`SELECT * FROM restoran WHERE restoran_admin IS null`,
                [], function(err, results) {
                  done();
                  if (err) {
                    console.info(err);
                    res.sendStatus(500);
                  } else {
                    errors.push({message: "Korisnik sa ovim mailom već postoji."});
                    res.render('superadmin_administracija_uposlenici', { title: naslov, errors: errors, restorani: results.rows })
                  }
                });
          });
        } else {
          pool.connect(function(err, client, done) {
            if (err) {
              res.end('{"error" : "Error", "status" : 500}');
            }
            client.query(`INSERT INTO korisnik (korisnik_ime, korisnik_prezime, korisnik_mail, korisnik_sifra, korisnik_tip)
                              VALUES ($1, $2, $3, $4, $5) RETURNING korisnik_id
                `, [ime, prezime, mail, kriptovana_sifra, tip], function(err, result) {
              done();
              if (err) {
                console.info(err);
                res.sendStatus(500);
              } else {
                let korisnik = result.rows[0].korisnik_id;
                pool.connect(function(err, client, done) {
                  if (err) {
                    res.end('{"error" : "Error", "status" : 500}');
                  }
                  client.query(`UPDATE restoran SET restoran_admin = $1 WHERE restoran_id = $2
                `, [korisnik, restoran], function(err, results) {
                    done();
                    if (err) {
                      console.info(err);
                      res.sendStatus(500);
                    } else {
                      res.redirect('/administracija/posao');
                    }
                  });
                });
              }
            });
          });
        }
      }
    });
  });
});
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Dostavljač--------------------------------------------------------//

router.post('/dostavljac', nije_autentificiran, adminplus, async function(req, res, next) {
  let ime = req.body.ime;
  let prezime = req.body.prezime;
  let mail = req.body.mail;
  let sifra = req.body.sifra;
  let tip = 3;

  let errors = [];

  if (sifra.length < 6) {
    errors.push({message: "Šifra se treba sastojati barem od 6 karaktera."});
  }

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
          res.render('superadmin_administracija_uposlenici', { title: naslov, errors: errors })
        } else {
          pool.connect(function(err, client, done) {
            if (err) {
              res.end('{"error" : "Error", "status" : 500}');
            }
            client.query(`INSERT INTO korisnik (korisnik_ime, korisnik_prezime, korisnik_mail, korisnik_sifra, korisnik_tip)
                              VALUES ($1, $2, $3, $4, $5) RETURNING korisnik_id
                `, [ime, prezime, mail, kriptovana_sifra, tip], function(err, result) {
              done();
              if (err) {
                console.info(err);
                res.sendStatus(500);
              } else {
                res.redirect('/administracija/posao');
              }
            });
          });
        }
      }
    });
  });
});
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Artikal-----------------------------------------------------------//

router.post('/artikal', nije_autentificiran, admin, upload, async function(req, res, next) {

  let artikal_naziv = req.body.ime;
  let artikal_tip = parseInt(req.body.tip);
  let artikal_cijena = parseInt(req.body.cijena);
  let artikal_cijena_akcija = parseInt(req.body.cijena_akcija);
  let artikal_slika = req.file.filename;
  let artikal_popularnost = parseInt(req.body.popularnost);
  let artikal_specijalna_kategorija = req.body.specijalnaKategorija;

  let artikal_id_admina = req.user.korisnik_id;

  pool.connect(function(err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`SELECT restoran_id FROM restoran WHERE restoran_admin = $1
                `, [artikal_id_admina], function(err, result) {
      done();
      if (err) {
        console.info(err);
        res.sendStatus(500);
      } else {
        let artikal_restoran = result.rows[0].restoran_id;
        pool.connect(function(err, client, done) {
          if (err) {
            res.end('{"error" : "Error", "status" : 500}');
          }
          client.query(`INSERT INTO artikal (artikal_naziv, artikal_tip, artikal_cijena, artikal_restoran, artikal_cijena_akcija, artikal_akcija, artikal_slika, artikal_popularnost, artikal_specijalna_kategorija)
                              VALUES ($1, $2, $3, $4, $5, false, $6, $7, $8)
                `, [artikal_naziv, artikal_tip, artikal_cijena, artikal_restoran, artikal_cijena_akcija, artikal_slika, artikal_popularnost, artikal_specijalna_kategorija], function(err, results) {
            done();
            if (err) {
              console.info(err);
              res.sendStatus(500);
            } else {
              res.redirect('/administracija/restoran');
            }
          });
        });
      }
    });
  });
});

//--------------------------------------------------Meni--------------------------------------------------------------//

router.post('/meni', nije_autentificiran, admin, upload, async function(req, res, next) {

  let grupni_meni_naziv = req.body.ime;
  let grupni_meni_artikal1 = req.body.artikal1;
  let grupni_meni_artikal2 = req.body.artikal2;
  let grupni_meni_artikal3 = req.body.artikal3;
  let grupni_meni_artikal4 = req.body.artikal4;

  let grupni_meni_cijena = parseInt(req.body.cijena);
  let grupni_meni_slika = req.file.filename;

  let grupni_meni_id_admina = req.user.korisnik_id;

  pool.connect(function(err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`SELECT restoran_id FROM restoran WHERE restoran_admin = $1
                `, [grupni_meni_id_admina], function(err, result) {
      done();
      if (err) {
        console.info(err);
        res.sendStatus(500);
      } else {
        let grupni_meni_restoran = result.rows[0].restoran_id;
        pool.connect(function(err, client, done) {
          if (err) {
            res.end('{"error" : "Error", "status" : 500}');
          }
          client.query(`INSERT INTO grupni_meni (grupni_meni_naziv, grupni_meni_artikal1, grupni_meni_artikal2, grupni_meni_artikal3, grupni_meni_artikal4, grupni_meni_cijena, grupni_meni_slika, grupni_meni_restoran)
                              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [grupni_meni_naziv, grupni_meni_artikal1, grupni_meni_artikal2, grupni_meni_artikal3, grupni_meni_artikal4, grupni_meni_cijena, grupni_meni_slika, grupni_meni_restoran], function(err, results) {
            done();
            if (err) {
              console.info(err);
              res.sendStatus(500);
            } else {
              res.redirect('/administracija/meniji');
            }
          });
        });
      }
    });
  });
});

//TODO superadmin
//--------------------------------------------------Tip artikla-------------------------------------------------------//
router.post('/tip/artikal', nije_autentificiran, super_admin, function(req, res, next) {

  let naziv = req.body.noviTipArtikla;

  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`INSERT INTO artikal_tip_lookup (artikal_tip_lookup_naziv) VALUES ($1);`,
        [naziv], function(err, result) {
      done();
      if (err) {
        console.info(err);
        res.sendStatus(500);
      } else {
        res.redirect('/administracija/restorani');
      }
    });
  });
});
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Tip restorana-----------------------------------------------------//
router.post('/tip/restoran', nije_autentificiran, super_admin, function(req, res, next) {

  let naziv = req.body.noviTipRestorana;

  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`INSERT INTO restoran_tip_lookup (restoran_tip_lookup_naziv) VALUES ($1);`,
        [naziv], function(err, result) {
          done();
          if (err) {
            console.info(err);
            res.sendStatus(500);
          } else {
            res.redirect('/administracija/restorani');
          }
        });
  });
});
//--------------------------------------------------------------------------------------------------------------------//

module.exports = router;
