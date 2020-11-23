/*jshint esversion: 6 */

const express = require('express')
const router = express.Router()
const passport = require('passport')

const User = require('../models/user.model')
const Offer = require('../models/offer.model')

const bcrypt = require('bcryptjs')
const bcryptSalt = 10

const isLogged = (req, res, next) => req.isAuthenticated() ? next() : res.render('company/company-login', { errorMsg: 'Acceso denegado. Haz login para acceder a esta zona de la web.' })
const checkRole = admittedRoles => (req, res, next) => admittedRoles.includes(req.user.role) ? next() : res.render('company/company-login', { errorMsg: 'Acceso denegado. No tienes permisos para ver esta zona de la web. Por favor, contacta con el administrador de la web.' })


// ZONA PÚBLICA:

// Endpoints /company
router.get('/', (req, res, next) => res.render('company/company-index'))

// MOSTRAR FORMULARIO DE REGISTRO

router.get('/signup', (req, res, next) => res.render('company/company-signup'))

// GESTIONAR REGISTRO EN BBDD

router.post('/signup', (req, res, next) => {

    const { username, password, name } = req.body

    if (!username || !password || !name) {
        res.render('company/company-signup', { errorMsg: 'Por favor, rellena todos los campos' })
        return
    }

    User
        .findOne({ username })
        .then(theUser => {
            if (theUser) {
                res.render('company/company-signup', { errorMsg: 'Nombre de usuario ya registrado.' })
                return
            }

            const salt = bcrypt.genSaltSync(bcryptSalt)
            const hashPass = bcrypt.hashSync(password, salt)

            User
                .create({ username, password: hashPass, name })
                .then(() => res.redirect('/company/login'))
                .catch(() => res.render('company/company-signup', { errorMsg: 'Nombre de empresa ya registrada. Contacta con el responsable de tu empresa.' }))

        })

        .catch(err => next(err))

})


// MOSTRAR FORMULARIO LOGIN

router.get('/login', (req, res, next) => res.render('company/company-login', { errorMsg: req.flash('error') }))

// GESTIONAR FORMULARIO LOGIN

router.post('/login', passport.authenticate('local', {
    successRedirect: '/company/private-company', //are-privada/perfil
    failureRedirect: '/company/login',
    failureFlash: true,
    passReqToCallback: true
}))


// CERRAR SESION
router.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/company/login')
})



//ZONA PRIVADA , 'BUSINESS-RECRUITER'.



// PERFIL-AREA PRIVADA DE EMPRESAS - VISUALIZACIÓN, EDICIÓN Y CREACIÓN DE NUEVAS OFERTAS
router.get('/private-company', isLogged, checkRole(['BUSINESS-RECRUITER']), (req, res, next) => {

    Offer
        .find({ company: req.user.id })
        .then(allOffers => res.render('company/company-profile', { allOffers, user: req.user }))
        .catch(err => next(new Error(err)))

})

router.post('/private-company', isLogged, checkRole(['BUSINESS-RECRUITER']), (req, res, next) => {

    const { title, location, study, style, description, name, email, company } = req.body


    if (!title || !location || !study || !style || !description || !email) {
        res.render('company/company-profile', { errorMsg: 'Por favor, rellena todos los campos para crear la oferta' })
        return
    }

    Offer
        .create({ title, location, study, style, description, name, email, company })
        .then(() => res.redirect('/company/private-company'))
        .catch(err => next(new Error(err)))

})


// ELIMINAR UNA OFERTA DE EMPLEO
router.get('/private-company/delete', isLogged, checkRole(['BUSINESS-RECRUITER']), (req, res, next) => {

    Offer
        .findByIdAndRemove(req.query.id)
        .then(() => res.redirect('/company/private-company'))
        .catch(err => next(new Error(err)))
})


// EDICIÓN DE LA OFERTA DEL COPÓN
router.get('/private-company/edit', isLogged, checkRole(['BUSINESS-RECRUITER']), (req, res, next) => {


    Offer
        .findById(req.query.id)
        .then(editOffer => res.render('company/company-edit', { editOffer }))
        .catch(err => next(new Error(err)))

})


router.post('/private-company/edit', isLogged, checkRole(['BUSINESS-RECRUITER']), (req, res, next) => {

    const { title, location, study, style, description, name, email } = req.body

    Offer
        .findByIdAndUpdate(req.query.id, { title, location, study, style, description, name, email })
        .then(() => res.redirect('/company/private-company'))
        .catch(err => next(new Error(err)))

})





module.exports = router