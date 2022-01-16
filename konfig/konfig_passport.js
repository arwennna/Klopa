const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
var pool = require('../konfig/konfig_baza');


function inicijaliziraj(passport) {

    const authenticateUser = (email, password, done) => {
        pool.query(
            `SELECT * FROM korisnik WHERE korisnik_mail = $1`,
            [email],
            (err, results) => {
                if (err) {
                    throw err;
                }
                if (results.rows.length > 0) {
                    const user = results.rows[0];
                    bcrypt.compare(password, user.korisnik_sifra, (err, isMatch) => {
                        if (err) {
                            console.log(err);
                        }
                        if (isMatch) {
                            return done(null, user);
                        } else {
                            return done(null, false, { message: "Neispravan password." });
                        }
                    });
                } else {
                    return done(null, false, {
                        message: "Ne postoji korisnik sa tom e-mail adresom."
                    });
                }
            }
        );
    };

    passport.use(
        new LocalStrategy(
            { usernameField: "email", passwordField: "password" },
            authenticateUser
        )
    );
    passport.serializeUser((user, done) => done(null, user.korisnik_id));

    passport.deserializeUser((id, done) => {
        pool.query(`SELECT * FROM korisnik WHERE korisnik_id = $1`, [id], (err, results) => {
            if (err) {
                return done(err);
            }
            return done(null, results.rows[0]);
        });
    });
}

module.exports = inicijaliziraj;