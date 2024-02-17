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

  // chall id로 조회해서 챌린지 정보 가져오는 api
  router.get('/challenge/:chall_id', async (req, res)=>{
    console.log("get challenge by id")
    let challId = req.params.chall_id
    console.log(challId)

    let result = await db.collection('activated_chall').findOne({_id: new ObjectId(challId)})
    console.log(result)
    let money = result.money

    /*var chall_id = result._id.toString()
    var challName = result.challName
    var chall*/

    res.json({
      depositData: money
    })
  })

  //참가하기 눌렀을 때 해당 challenge document에 user id 추가 및 user num 업데이트하는 api
  router.patch('/challenge/:chall_id', async (req, res)=>{
    console.log("put user_id to activated_chall")
    const challId = req.params.chall_id
    //console.log(req.body)
    let result = await db.collection('activated_chall').findOne({_id: new ObjectId(challId)})
    let userlist = result.user_list
    let usernum = result.user_num
    if (userlist.includes(req.body.data, 0)==false){
      userlist.push(req.body.data)
      usernum = userlist.length

      let result2 = await db.collection('activated_chall').updateOne({_id: new ObjectId(challId)}, {$set: {user_list: userlist, user_num: usernum}}, function(err, res){
        if (err) {
          throw err
        }
        console.log("document 수정 완료")
        console.log(result2)
        db.close()
      })
    }
    
    //console.log(result)
    res.json({
      data: "Patch Success"
    })

  })

  //참가하기 눌렀을 때 해당 user document에 challenge id 추가하는 api
  router.patch('/user/:user_id', async (req, res)=>{
    console.log("put challenge_id to user")
    const userId = req.params.user_id
    //console.log(req.body)
    let result = await db.collection('user').findOne({_id: new ObjectId(userId)})
    let progresschall = result.progress_chall

    if (progresschall.includes(req.body.data, 0) == false){
      if (progresschall[0] == ""){
        progresschall[0] = req.body.data
      }
      else {
        progresschall.push(req.body.data)
      }

      let result2 = await db.collection('user').updateOne({_id: new ObjectId(userId)}, {$set: {progress_chall: progresschall}}, function(err, res){
        if (err) {
          throw err
        }
        console.log("document 수정 완료")
        console.log(result2)
        db.close()
      })
    }
    else{
      console.log("이미 존재하는 챌린지")
    }

    //console.log(progresschall)
    res.json({
      data: "Patch Success"
    })
  })

  


//이 파일 제일 하단에 router변수 export해줘야 server.js 메인파일에서 이 파일 접근가능
module.exports = router 