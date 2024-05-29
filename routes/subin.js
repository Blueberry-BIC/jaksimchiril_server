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


  //챌린지 참가하기
  router.put('/participate/:chall_id/:user_id', async (req, res)=> {
    const challId = req.params.chall_id
    const userId = req.params.user_id
    var msg = ""
    console.log(`participate challenge : ${challId}, with ${userId}`)
    try{
      let res0 = await db.collection('user').updateOne({_id:new ObjectId(userId)}, {"$pull": {progress_chall: ""}})
      let res1 = await db.collection('activated_chall').updateOne({_id:new ObjectId(challId)}, {"$push": {user_list: userId}, $inc:{user_num:1}})
      let res2 = await db.collection('user').updateOne({_id:new ObjectId(userId)}, {"$push": {progress_chall: challId}})
      msg = "참가 성공"
    } catch(e){
      console.log(e)
      msg = "참가 실패"
    }
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
    let result = await db.collection('user').findOne({_id: new ObjectId(userId)});

    if (result && result.progress_chall) {
      var progresschall = result.progress_chall

      for (i in progresschall){

        if(progresschall[i] == "") continue
        var challdata = await db.collection('activated_chall').findOne({_id: new ObjectId(progresschall[i])})
        if (challdata){
          mychallArray[i] = challdata
          mychallArray[i]._id = progresschall[i]
        }
      }
    }
    res.send(mychallArray);
  })

//참여중인 사용자가 클릭했는지를 확인하기 위해 각 activatedchall에서 userlist 확인하는 api
router.get('/get/userlist', async (req, res) =>{
  console.log('get userlist and certifystatus')
  var challId = req.query.challId
  var userId = req.query.userId
  console.log(`challId=${challId}, userId=${userId}`)
  let acuser = await db.collection('activated_chall').findOne({_id: new ObjectId(challId)})
  var res2 = false
  var msg = false

  if (acuser && acuser.user_list){
    var userlist = acuser.user_list
    msg = acuser.user_list.includes(userId)
    if (msg){
      var usercertify = acuser[`${userId}`]
      usercertify ? res2=usercertify[1] : res2 = false
      console.log(`userlist = ${userlist}, ${res2}`)
    }
  }
  res.json({
    isparticipant: msg,
    certified: res2
  })
})


// 사용자별 종료된 챌린지 가져오는 함수
router.get('/get/:user_id/completed', async (req, res)=>{
  const user = req.params.user_id;
  const projection = { _id: 1, chall_name: 1, start_date: 1, auth_method: 1, category: 1, user_num: 1, total_days: 1, money: 1 }
  let completed = await db.collection('completed_chall').find({user_list: user}).project(projection).toArray()
  console.log(completed);

  for (i in completed) {
    completed[i]._id = completed[i]._id.toString();
  }
  res.send(completed);
})

//이 파일 제일 하단에 router변수 export해줘야 server.js 메인파일에서 이 파일 접근가능
module.exports = router 