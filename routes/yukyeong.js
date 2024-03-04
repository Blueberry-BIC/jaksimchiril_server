//유경 api 개발 파일

//express라이브러리 가져옴
const router = require('express').Router()
const ObjectId = require('mongodb').ObjectId

// 몽고DB 객체 가져오는 작업. 이 파일에서 db 접근가능하게 하기 위함 ///////////////////////
let connectDB = require('./../database.js') //database.js 파일 경로

let db
connectDB.then((client) => {
  console.log('유경 파일 DB연결성공')
  db = client.db('BIC_DB')
}).catch((err) => {
  console.log(err)
}) 

//////////////////////////////////////////////


/*  //api 테스트용
router.get('/test', async (요청, 응답)=>{
    응답.send('/test로 접속 성공')
  })
*/


/** @type { _id: ObjectId, chall_name: string, start_date: Date, end_date: Date, auth_method: int, chall_desc: string, is_public: boolean, category: string, passwd: int, user_num: int, total_days: int, is_progress: int, money: int } challdata */
router.get('/activated_chall', async (req, res) => {
  console.log(`get activated challenge info`);
  var challdata = await db.collection('activated_chall').find().toArray();
  for (i in challdata) {
    challdata[i]._id = challdata[i]._id.toString();
  }
  // console.log(challdata)
  
  res.send(challdata);
})

router.get('/user/:walletaddr', async (req, res) => {
  console.log(`get user id info`);
  console.log(req.params);
  var userid = await db.collection('user').findOne({wallet_addr: req.params.walletaddr}, {projection:{ _id: 1 }});
  console.log(userid.toString());
  console.log(userid._id.toString());

  res.send(userid._id.toString());
})

router.get('/chall/:challId', function (req, res) {
  console.log(`get challenge info`);
  console.log(req.path);
  var challdata = db.collection('activated_chall').find();
  res.send({"result": "GET 호출"});
})

router.post('/chall', async (req, res, next) => {
  console.log(`set challenge info`);
  // console.log(req.body);
  var name = req.body.challName;
  var desc = req.body.challDesc;
  var ispub = req.body.isPublic;
  var category = req.body.category;
  var passwd = req.body.passwd;
  var auth = req.body.authMethod;
  var startdate = req.body.startdate;
  var enddate = req.body.enddate;
  var totaldays = req.body.totalDays;
  var usernum = req.body.userNum;
  var isprogress = req.body.isProgress;
  var money = req.body.money;

  db.collection('activated_chall').insertOne(
    {chall_name: name, start_date: new Date(startdate), end_date: new Date(enddate), auth_method: auth, chall_desc: desc, is_public: ispub, category: category, passwd: passwd, user_num: usernum, total_days: totaldays, is_progress: isprogress, money: money}, function(error, result) {
      console.log(`post success`)
      if (error) {
        console.log(error);
      }
      db.close();
  });
  res.send({"result": "POST Success"});
})

router.put('/chall', (req, res) => {
  console.log(`update challenge info`);
  console.log(req.body);
  // console.log(req.body.challName);
  // db.collection('activated_chall').update(req.body);
  // var name = req.body.challName;
  // var desc = req.body.challDesc;
  // var ispub = req.body.isPublic;
  // var category = req.body.category;
  // var passwd = req.body.passwd;
  const {name, desc, ispub, category, passwd} = req.body

  db.collection('activated_chall').insertOne(
    {chall_name: name, chall_desc: desc, is_public: ispub, category: category, passwd: passwd}, function(error, result) {
      console.log(`post success`)
      if (error) {
        console.log(error)
      }

  });
  res.send({"result": "PUT 호출"});
})




//이 파일 제일 하단에 router변수 export해줘야 server.js 메인파일에서 이 파일 접근가능
module.exports = router 
