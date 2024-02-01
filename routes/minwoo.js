//민우 api 개발 파일      http://localhost:8081

const router = require('express').Router()


// 몽고DB 객체 가져오는 작업. 이 파일에서 db 접근가능하게 하기 위함 ///////////////////////
let connectDB = require('./../database.js') //database.js 파일 경로

let db
connectDB.then((client)=>{
  console.log('민우 파일 DB연결성공')
  db = client.db('BIC_DB')
}).catch((err)=>{
  console.log(err)
}) 
//////////////////////////////////////////////

// // http://localhost:8081/news 로 접속시 몽고db 데이터 추가
// router.get('/news', async (요청, 응답)=>{
//     await db.collection('activated_chall').insertOne({
//       chall_name : '챌린지이름', 
//       start_date : new Date(),
//       end_date : new Date(),
//       auth_method : 1,
//       chall_desc : '챌린지설명',
//       is_public : true,
//       category : '코딩',
//       passwd : 1234,
//       user_num : 5,
//       user_list : [1,2,3],
//       is_success : [0,3,2],
//       total_days : 10,
//     })
//     응답.send('성공')
//   })


  // router.get('/news', async (요청, 응답)=>{
  //   await db.collection('image_storage').insertOne({
  //     chall_id : new ObjectId(요청.body._id),
  //     user_list : [1,2,3],
  //     image_list : ['이미지경로1','이미지경로2','이미지경로3'],
  //     warning_list : [0,0,0],
  //   })
  //   응답.send('성공')
  // })

  
  //액션퀴즈 db에 추가해주는 api
  // router.post('/add', async (요청, 응답,next)=>{
  //   await db.collection('action').insertOne({
  //     category : "코딩퀴즈",
  //     limited_time : 15,
  //     problem : "11컴퓨터 시스템을 통제하고 프로그램의 연산을 처리하는 가장 핵심적인 컴퓨터의 제어 장치, 혹은 그 기능을 내장한 칩을 일컫는 말은? (영문 소문자로 작성하시오.)",
  //     answer : "cpu"
  //   })
  //   응답.send('성공')
  // })


  // //테스트 api
  // router.get('/news', async (요청, 응답)=>{
  //   await db.collection('admin_wallet').insertOne({
  //     wallet_addr : "지갑주소",
  //   })
  //   응답.send('성공')
  // })


//   //액션퀴즈 db에 추가해주는 api - 그냥 웹브라우저 띄워서 get요청후 바로 db에 꽂아주기 위해 사용(원래는 post해야함)
//  router.get('/add', async (요청, 응답, next)=>{

//   console.log(요청.body)

//   // await db.collection('action').insertOne({
//   //   category : "코딩퀴즈",
//   //   limited_time : 15,
//   //   problem : "11컴퓨터 시스템을 통제하고 프로그램의 연산을 처리하는 가장 핵심적인 컴퓨터의 제어 장치, 혹은 그 기능을 내장한 칩을 일컫는 말은? (영문 소문자로 작성하시오.)",
//   //   answer : "cpu"
//   // })
  
//   응답.send('성공')
// })
  


  //액션퀴즈 데이터 하나 보내주는 api
  router.get('/action', async (요청, 응답)=>{
    
    //랜덤하게 액션퀴즈 docu 하나 가져오기
    let result =  await db.collection('action').aggregate([{'$sample': { 'size': 1 } }]).toArray()

    console.log(result)
    
    응답.json({result : result}) 
  })








//이 파일 제일 하단에 router변수 export해줘야 server.js 메인파일에서 이 파일 접근가능
module.exports = router 


// http://localhost:8081/