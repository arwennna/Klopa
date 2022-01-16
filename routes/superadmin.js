var express = require('express');
var router = express.Router();

//--------------------------------------------------Konfiguracija-----------------------------------------------------//

const naslov = "KLOPA";

var passport = require('passport');
var pool = require('../konfig/konfig_baza');

var inicijaliziraj = require('../konfig/konfig_passport');
inicijaliziraj(passport);

var {
  nije_autentificiran,
  super_admin, porediPoPopularnosti
} = require('../funkcije/pomocne');

//--------------------------------------------------Superadmin-prikaz restorana---------------------------------------//

router.get('/restoran/:id', nije_autentificiran, super_admin, function(req, res, next) {

  let id = req.params.id;

  pool.connect(function(err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`
                    SELECT * FROM restoran
                    INNER JOIN restoran_tip_lookup ON
                    restoran.restoran_tip = restoran_tip_lookup.restoran_tip_lookup_id
                    WHERE restoran.restoran_id = $1;`,
        [id], function(err, result) {
          done();
          if (err) {
            console.info(err);
            res.sendStatus(500);
          } else {
            pool.connect(function(err, client, done) {
              if (err) {
                res.end('{"error" : "Error", "status" : 500}');
              }
              client.query(`
                    SELECT * FROM artikal
                    INNER JOIN artikal_tip_lookup ON
                    artikal.artikal_tip = artikal_tip_lookup.artikal_tip_lookup_id
                    WHERE artikal.artikal_restoran = $1;`,
                  [id], function(err, results) {
                    done();
                    if (err) {
                      console.info(err);
                      res.sendStatus(500);
                    } else {
                      pool.connect(function(err, client, done) {
                        if (err) {
                          res.end('{"error" : "Error", "status" : 500}');
                        }
                        client.query(`
                              SELECT * FROM grupni_meni
                              WHERE grupni_meni.grupni_meni_restoran = $1;`,
                            [id], function(err, results1) {
                              done();
                              if (err) {
                                console.info(err);
                                res.sendStatus(500);
                              } else {
                                let akcije = [];
                                let najpopularniji = results.rows.sort(porediPoPopularnosti);
                                if (najpopularniji.length >= 5) {
                                    najpopularniji = najpopularniji.slice(0, 5);
                                }
                                for (let i = 0; i < results.rows.length; i++) {
                                    if (results.rows[i].artikal_akcija)
                                        akcije.push(results.rows[i]);
                                }
                                res.render('superadmin/superadmin_restoran.ejs', { title: naslov, korisnik: req.user, restoran: result.rows[0], artikli: results.rows, meniji: results1.rows, akcije: akcije, najpopularniji: najpopularniji });
                              }
                            });
                      });
                    }
                  });
            });
          }
        });
  });
});

//--------------------------------------------------------------------------------------------------------------------//



module.exports = router;
