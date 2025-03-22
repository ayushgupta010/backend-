import {Router} from 'express';
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getwatchHistory, loginUser, logoutUser,
     refreshAccessToken, registerUser, UpdateAccountDetalis, 
     updateUserAvatar,updateUseroverImage} from '../controllers/user.controller.js'
import {upload} from '../middlewares/multer.middleware.js'
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { get } from 'mongoose';

const router = Router();



router.route('/register').post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverimage",
            maxCount:1
        }
    ]),
    registerUser
)

router.route('/login').post(loginUser)

//secure routes

router.route('/logout').post( verifyJWT ,logoutUser)

router.route('/refresh-token').post(refreshAccessToken)

router.route('/changePassword').post(verifyJWT, changeCurrentPassword)

router.route('/current-user').get(verifyJWT, getCurrentUser)

router.route('/update-account').patch(verifyJWT, UpdateAccountDetalis)

router.route('/avatar').patch(verifyJWT, upload.single('avatar'), updateUserAvatar)

router.route('/coverimage').patch(verifyJWT, upload.single('coverimage'), updateUseroverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

router.route('/history').get(verifyJWT, getwatchHistory)

export default router