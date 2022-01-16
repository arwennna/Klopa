var express = require('express');
var router = express.Router();

var express = require('express');
var router = express.Router();

var multer = require('multer');
var path = require('path');

//--------------------------------------------------Konfiguracija-----------------------------------------------------//
const naslov = "KLOPA";

var passport = require('passport');
var pool = require('../konfig/konfig_baza');

var inicijaliziraj = require('../konfig/konfig_passport');
inicijaliziraj(passport);

var {
  nije_autentificiran,
  super_admin,
  admin,
  kupac,
  dostavljac} = require('../funkcije/pomocne');

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

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Izmjena  restorana------------------------------------------------//
router.post('/restoran', nije_autentificiran, super_admin, upload, function(req, res, next) {

  let id = req.body.restoranUpdate;
  let novi_naziv = req.body.nazivUpdate;
  let novi_tip = req.body.tipUpdate;
  let nova_ocjena = req.body.ocjenaUpdate;
  let slika = req.file.filename;

  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`UPDATE restoran
                  SET 
                    restoran_naziv = $1,
                    restoran_tip = $2,
                    restoran_ocjena = $3,
                    restoran_slika = $4
                    WHERE restoran_id = $5;`, [novi_naziv, novi_tip, nova_ocjena, slika, id], function(err, result) {
      done();
      if (err) {
        console.info(err);
        res.sendStatus(500);
      } else {
        pool.connect(function(err, client, done) {
          if (err) {
            res.end('{"error" : "Error", "status" : 500}');
          }
          res.redirect('/administracija/restorani');
        });
      }
    });
  });
});

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Izmjena  restorana (admin)----------------------------------------//
router.post('/restoranAdmin', nije_autentificiran, admin, upload, function(req, res, next) {

  let id = req.body.id;
  let udaljenost_dostave_km = req.body.udaljenostDostave;
  let slika = req.file.filename;

  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`UPDATE restoran
                  SET 
                    restoran_udaljenost_dostave_km = $1,
                    restoran_slika = $2
                    WHERE restoran_id = $3;`, [udaljenost_dostave_km, slika, id], function(err, result) {
      done();
      if (err) {
        console.info(err);
        res.sendStatus(500);
      } else {
        pool.connect(function(err, client, done) {
          if (err) {
            res.end('{"error" : "Error", "status" : 500}');
          }
          res.redirect('/glavna');
        });
      }
    });
  });
});
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Izmjena tipa restorana--------------------------------------------//
router.put('/restoran/tip/:id', nije_autentificiran, super_admin, function(req, res, next) {

  let novi_naziv = req.body.novi_tip_naziv;
  let id = req.params.id;

  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`UPDATE restoran_tip_lookup SET restoran_tip_lookup_naziv = $1 WHERE restoran_tip_lookup_id = $2`, [novi_naziv, id], function(err, result) {
      done();
      if (err) {
        console.info(err);
        res.sendStatus(500);
      } else {
        pool.connect(function(err, client, done) {
          if (err) {
            res.end('{"error" : "Error", "status" : 500}');
          }
          res.sendStatus(200);
        });
      }
    });
  });
});
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Izmjena tipa artikla----------------------------------------------//
router.put('/artikal/tip/:id', nije_autentificiran, super_admin, function(req, res, next) {

  let novi_naziv = req.body.novi_tip_naziv;
  let id = req.params.id;

  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`UPDATE artikal_tip_lookup SET artikal_tip_lookup_naziv = $1 WHERE artikal_tip_lookup_id = $2`, [novi_naziv, id], function(err, result) {
      done();
      if (err) {
        console.info(err);
        res.sendStatus(500);
      } else {
        pool.connect(function(err, client, done) {
          if (err) {
            res.end('{"error" : "Error", "status" : 500}');
          }
          res.sendStatus(200);
        });
      }
    });
  });
});

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Izmjena artikla---------------------------------------------------//
router.put('/artikal/akcija/:id', nije_autentificiran, admin, function(req, res, next) {

  let stanje = null
  if (req.body.stanje == 'false')
    stanje = true;
  else if (req.body.stanje == 'true')
    stanje = false;

  let id = req.params.id;

  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`UPDATE artikal SET artikal_akcija = $1 WHERE artikal_id = $2`, [stanje, id], function(err, result) {
      done();
      if (err) {
        console.info(err);
        res.sendStatus(500);
      } else {
        res.sendStatus(200);
      }
    });
  });
});

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Rejting narudžbe--------------------------------------------------//
router.put('/narudzba/ocijeni', nije_autentificiran, kupac, function(req, res, next) {

  console.log(req);
  let nova_ocjena = req.body.ocjena;
  console.log(nova_ocjena);
  let id = req.body.id;
  console.log(id);

  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`UPDATE narudzba SET narudzba_ocjena = $1 WHERE narudzba_id = $2`, [nova_ocjena, id], function(err, result) {
      done();
      if (err) {
        console.info(err);
        res.sendStatus(500);
      } else {
        pool.connect(function(err, client, done) {
          if (err) {
            res.end('{"error" : "Error", "status" : 500}');
          }
          res.sendStatus(200);
        });
      }
    });
  });
});

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Potvrda narudžbe--------------------------------------------------//
router.put('/narudzba/dostava', nije_autentificiran, dostavljac, function(req, res, next) {

  let narudzba_status = req.body.status;
  let id = req.body.id;
  let restoran = req.body.restoran;
  let mail = req.user.korisnik_mail;
  let dostavljac = req.user.korisnik_ime + ' ' + req.user.korisnik_prezime;

  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`UPDATE narudzba SET narudzba_status = $1 WHERE narudzba_id = $2`, [narudzba_status, id], function(err, result) {
      done();
      if (err) {
        console.info(err);
        res.sendStatus(500);
      } else {

        let poruka = null;
        if (narudzba_status == 1)
          poruka = 'Narudžba pod rednim brojem ' + id + ' je dostavljena. ';
        else if (narudzba_status == 2)
          poruka = 'Narudžba pod rednim brojem ' + id + ' nije dostavljena. ';

        poruka += 'Dostavljač: ' + dostavljac;

        let mailOptions = {
          from: mail,
          to: 'klopa.user1@gmail.com',
          subject: 'Klopa - status narudžbe',
          text: poruka
        };

        transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
        res.sendStatus(200);
      }
    });
  });
});

//--------------------------------------------------------------------------------------------------------------------//

module.exports = router;
