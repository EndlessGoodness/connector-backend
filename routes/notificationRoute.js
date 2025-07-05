const express = require('express');
const isAuthorized= ()=>{
    if(locals.user){
        return true;
    }else{
        return false;
    }
};
const notificationsControllers = require('../controllers/notifications');
const router = express.Router();

router.get('/', notificationsControllers.getNotifications);

module.exports = router;