// 수빈 api 개발 파일

//express라이브러리 가져옴
// 몽고DB 객체 가져오는 작업. 이 파일에서 db 접근가능하게 하기 위함 ///////////////////////
const router = require('express').Router()
const { ObjectId } = require('mongodb')
let connectDB = require('./../database.js') //database.js 파일 경로

let db
connectDB.then((client)=>{
  console.log('수빈 파일 DB연결성공')
  db = client.db('BIC_DB')
}).catch((err)=>{
  console.log(err)
}) 
//////////////////////////////////////////////


//api ////////////////////////////////////////////////////////////////////////////////////////////

  //관리자 지갑 주소 가져오는 api
  router.get('/admin_wallet', async (req, res)=>{
    
    /** @type { wallet_addr : string }  */
    console.log("get wallet address")
    let result =  await db.collection('admin_wallet').find({}).toArray()
    const walletdata = result[0].wallet_addr; // string
    console.log(walletdata)

    res.json({
      walletAddr: walletdata
    })
  })

  // 참가하기 눌렀을 때 activated_chall collection 업데이트하는 api
  router.put('/participate/:chall_id', async (req, res)=> {
    console.log("PUT user_list")
    const challId = req.params.chall_id
    //console.log(req.body)
    let msg = ""

    var usernum = req.body.userNum
    var userlist = req.body.userList

    try {
      let result = await db.collection('activated_chall').updateOne({_id: new ObjectId(challId)}, {$set: {user_list: userlist, user_num: usernum}})
      msg = "챌린지 참여 완료되었습니다."
    } catch (err) {
      console.log(`ERROR: ${err}`)
    }

    res.json({
      data: msg
    })

  })

  //참가하기 눌렀을 때 user collection 업데이트하는 api
  router.patch('/participate/:user_id', async (req, res)=>{
    console.log("PATCH progress_chall")
    const userId = req.params.user_id
    //console.log(req.body)
    let result = await db.collection('user').findOne({_id: new ObjectId(userId)})
    let progresschall = result.progress_chall
    let msg = ""

    if (progresschall.includes(req.body.data, 0) == false){
      if (progresschall[0] == ""){
        progresschall[0] = req.body.data
      }
      else {
        progresschall.push(req.body.data)
      }
      try {
        let result2 = await db.collection('user').updateOne({_id: new ObjectId(userId)}, {$set: {progress_chall: progresschall}})
        msg = "챌린지 참여 완료되었습니다."
      } catch (err) {
        console.log(`ERROR: ${err}`)
      }
    }
    else{
      console.log("이미 존재하는 챌린지")
      msg = "이미 존재하는 챌린지입니다"
    }

    //console.log(progresschall)
    res.json({
      data: msg
    })
  })



//이 파일 제일 하단에 router변수 export해줘야 server.js 메인파일에서 이 파일 접근가능
module.exports = router 