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

  // 지갑 주소로 사용자가 DB에 존재하는 유저인지 확인하는 api
  router.get('/check/:walletAddr', async (req, res)=>{
    console.log("check exist user by walletaddr")
    var walletdata = req.params.walletAddr
    console.log(walletdata)
    let result = await db.collection('user').findOne({wallet_addr: walletdata})
    console.log(`result = ${result.name}`)
    if (result == null){
      //DB에 존재하지 않는 신규 유저
      res.json({
        existUser: false
      })
    }
    else {
      //DB에 존재하는 기존 유저
      res.json({
        existUser: true
      })
    }
  })

  // 신규 유저 등록 api
  router.post('/user/add', async(req, res)=>{
    console.log("register new user")
    console.log(req.body)
    
    var name = req.body.userName
    var wallet_addr = req.body.walletAddr
    var github_id = req.body.githubId
    var emptystack = new Array("")

    try {
      let result = await db.collection('user').insertOne({name: name, wallet_addr: wallet_addr, github_id: github_id, prize:"0", stack1:emptystack, stack2: emptystack, stack3: emptystack, stack4: emptystack, progress_chall: emptystack})
    } catch(err){
      console.log(`ERROR: ${err}`)
    }

    res.json({
      data: name
    })
  })

  // 참가하기 눌렀을 때 activated_chall collection 업데이트하는 api
  router.put('/participate/:chall_id', async (req, res)=> {
    console.log("PUT user_list")
    const challId = req.params.chall_id
    console.log(req.body)
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
    console.log(result)

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
        //msg = true
      } catch (err) {
        console.log(`ERROR: ${err}`)
      }
    }
    else{
      console.log("이미 존재하는 챌린지")
      msg = "이미 존재하는 챌린지입니다"
      //msg = false
    }

    //console.log(progresschall)
    res.json({
      data: msg
    })
  })


  //참여중인 챌린지만 가져오기
  /** @type { _id: ObjectId, chall_name: string, start_date: Date, end_date: Date, auth_method: int, chall_desc: string, is_public: boolean, category: string, passwd: int, user_num: int, total_days: int, is_progress: int, money: int, user_list: Array } challdata */
  router.get('/get/mychall/:user_id', async (req, res) => {
    console.log(`get my challenges`);
    const userId = req.params.user_id
    var mychallArray = new Array();
    let result1 = await db.collection('user').findOne({_id: new ObjectId(userId)});
    var progresschall = result1.progress_chall

    if (progresschall){
      for (i in progresschall){
        console.log(progresschall[i])
        var challdata = await db.collection('activated_chall').findOne({_id: new ObjectId(progresschall[i])});
        mychallArray[i] = challdata
        mychallArray[i]._id = progresschall[i]
        console.log(challdata)
      }
    }
    
    res.send(mychallArray);
  })

//참여중인 사용자가 클릭했는지를 확인하기 위해 각 activatedchall에서 userlist 확인하는 api
router.get('/get/userlist', async (req, res) =>{
  console.log('get userlist and certifystatus')
  var challId = req.query.challId
  var userId = req.query.userId
  console.log(challId, userId)
  let acuser = await db.collection('activated_chall').findOne({_id: new ObjectId(challId)})
  var userlist = acuser.user_list
  var usercertify = false
  var msg = userlist.includes(userId)
  if (msg){
  var usercertify = acuser[`${userId}`]
  }
  console.log(`userlist = ${userlist}, ${usercertify}`)
  res.json({
    isparticipant: msg,
    certified: usercertify[1]
  })
})

//이 파일 제일 하단에 router변수 export해줘야 server.js 메인파일에서 이 파일 접근가능
module.exports = router 