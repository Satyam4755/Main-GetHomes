const express = require('express');
const hostRouter = express.Router();
const upload = require('../middleware/multer'); // Import multer middleware
const { addHome, adminHomeList, editHome, postAddHome, PosteditHome, deleteHome,getOrders } = require('../controller/host');

// GET route for adding homes page
hostRouter.get('/addHomes', addHome);

// GET route to show list of homes for the admin
hostRouter.get('/admin_HomeList', adminHomeList);

// POST route for adding a home with file upload
hostRouter.post('/addHomes', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'rules', maxCount: 1 }
]), postAddHome);
 
// GET route to show edit form for a specific home
hostRouter.get('/edit_home/:homeId', editHome);

// POST route to submit the edited home details
hostRouter.post('/edit_home', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'rules', maxCount: 1 }
]), PosteditHome);

// POST route for deleting a home
hostRouter.post('/delete_home/:homeId', deleteHome);

// GET route to show orders for the host
hostRouter.get('/orders', getOrders);

exports.hostRouter = hostRouter;
